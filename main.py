import os
import logging
import random
import string
import asyncio
import bcrypt
import jwt
import gc
import threading

from jwt import ExpiredSignatureError
from threading import Thread
from databases import Database
from pydantic import BaseModel

from fastapi import FastAPI, Request, HTTPException, Depends, status
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from fastapi.logger import logger as fastapi_logger
from fastapi.staticfiles import StaticFiles

import torch
from torch import cuda
from transformers import AutoTokenizer, AutoModelForCausalLM
from transformers import TextIteratorStreamer

from config import *

if DEBUG:
    environ_logger = "uvicorn"
    os.environ["SECRET_KEY"] = "Hi_Anslin_Raj"
else:
    gunicorn_error_logger = logging.getLogger("gunicorn.error")
    gunicorn_logger = logging.getLogger("gunicorn")

    uvicorn_access_logger = logging.getLogger("uvicorn.access")
    uvicorn_access_logger.handlers = gunicorn_error_logger.handlers

    fastapi_logger.handlers = gunicorn_error_logger.handlers
    fastapi_logger.setLevel(gunicorn_logger.level)
    environ_logger = "gunicorn.error"

    transformer_logger = logging.getLogger("transformers")
    transformer_logger.setLevel(logging.ERROR)


logger = logging.getLogger(environ_logger)

device = f"cuda:{cuda.current_device()}" if cuda.is_available() else "cpu"
logger.info(f"Device using: {device}")

os.environ[device] = "free"
gpu_list = [device]

app = FastAPI(docs_url=None, redoc_url=None)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

database = Database("sqlite+aiosqlite:///user.db")


class HealthCheckOutputData(BaseModel):
    health_check: str


class OutputModel(BaseModel):
    replay: str


class InputDataModel(BaseModel):
    question: str


class InputChatModel(BaseModel):
    prompt: str
    chat: list


async def get_database():
    await database.connect()
    yield database
    await database.disconnect()


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

SECRET_KEY = os.environ.get("SECRET_KEY", "None")

if SECRET_KEY == "None":
    with open("/app/secret_key.txt", "r") as file:
        SECRET_KEY = file.read()


class UserRegistration(BaseModel):
    user_name: str
    name: str
    role: str
    password: str


class UserLogin(BaseModel):
    user_name: str
    password: str


is_model_loaded = False
model_error = ""
try:
    global tokenizer
    tokenizer = AutoTokenizer.from_pretrained(HF_MODEL_REPO, device=device)
    global model
    model = AutoModelForCausalLM.from_pretrained(
        HF_MODEL_REPO, device_map=device, load_in_8bit=True
    )
    is_model_loaded = True
except Exception as error:
    model_error = error
    logger.error(f"An exception occurred while loading the model: {error}")


def generate_password(length):
    all_characters = (
        string.ascii_letters
        + string.digits
        + "_"
        + "-"
        + "+"
        + "="
        + "@"
        + "!"
        + "#"
        + "$"
        + "%"
        + "^"
        + "&"
        + "*"
        + "?"
        + "."
    )
    return "".join(random.choice(all_characters) for i in range(length))


@app.on_event("startup")
async def database_connect():
    await database.connect()
    try:
        await database.connect()
        query = "SELECT name FROM sqlite_master WHERE type='table' AND name='user';"
        result = await database.fetch_one(query)

        if result:
            logger.info("The user table has already been generated.")
        else:
            logger.info("Initiated the generation of the user table.")
            query = """CREATE TABLE user (user_name VARCHAR(100) PRIMARY KEY, hashed_password VARCHAR(70), name VARCHAR(100), role VARCHAR(30))"""
            await database.execute(query=query)
            password = generate_password(12)
            logger.info(f"Generated username / password: admin / {password}")
            hashed_password = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())
            insert_query = "INSERT INTO user(user_name, name, role, hashed_password) VALUES (:user_name, :name, :role, :hashed_password)"
            await database.execute(
                query=insert_query,
                values={
                    "user_name": "admin",
                    "name": "Admin",
                    "role": "admin",
                    "hashed_password": hashed_password,
                },
            )
            logger.info("User table generation completed.")

    except Exception as error:
        logger.error(f"An exception occurred during the FastAPI startup event: {error}")


@app.on_event("shutdown")
async def database_disconnect():
    await database.disconnect()


@app.get("/api/v1/health_check", response_model=HealthCheckOutputData)
async def home():
    return {"health_check": "OK"}


@app.post("/api/v1/auth")
async def get_token(user_data: UserLogin, db: Database = Depends(get_database)):
    try:
        query = "SELECT hashed_password FROM user WHERE user_name = :username"
        stored_password = await db.fetch_one(
            query=query, values={"username": user_data.user_name}
        )
    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Exception occured in auth: {error}"
        )
    if stored_password and bcrypt.checkpw(
        user_data.password.encode("utf-8"), stored_password["hashed_password"]
    ):
        try:
            access_token = create_access_token(data={"sub": user_data.user_name})
            return {"token": access_token}
        except Exception as error:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Exception occured in auth: {error}"
            )
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials."
        )


@app.post("/api/v1/users")
async def register_user(
    user_data: UserRegistration,
    db: Database = Depends(get_database),
    token: str = Depends(oauth2_scheme),
):
    try:
        credentials_exception = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )
        payload = jwt.decode(token, SECRET_KEY, algorithms=[JWT_ALGORITHM])
        auth_user_name: str = payload.get("sub")
        if auth_user_name is None:
            raise credentials_exception
        auth_user_query = "SELECT role FROM user WHERE user_name = :username"
        auth_user = await db.fetch_one(
            query=auth_user_query, values={"username": auth_user_name}
        )
        if auth_user.role != "admin":
            raise HTTPException(
                status_code=401, detail=f"User not authorized to do this operation"
            )

        existing_user_query = "SELECT user_name FROM user WHERE user_name = :username"
        existing_user = await db.fetch_one(
            query=existing_user_query, values={"username": user_data.user_name}
        )

        if existing_user:
            raise HTTPException(
                status_code=400,
                detail=f"User with name '{user_data.user_name}' already exists.",
            )
        try:
            hashed_password = bcrypt.hashpw(
                user_data.password.encode("utf-8"), bcrypt.gensalt()
            )
            insert_query = "INSERT INTO user(user_name, name, role, hashed_password) VALUES (:user_name, :name, :role, :hashed_password)"
            await db.execute(
                query=insert_query,
                values={
                    "user_name": user_data.user_name,
                    "name": user_data.name,
                    "role": user_data.role,
                    "hashed_password": hashed_password,
                },
            )
            return {"message": f"User '{user_data.user_name}' registered successfully."}
        except Exception as error:
            logger.error(f"An exception occurred while creating a user: {error}")
            raise HTTPException(status_code=500, detail=f"Error: {error}")
    except ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.exceptions.InvalidSignatureError as error:
        raise HTTPException(status_code=401, detail=f"{error}")


@app.get("/api/v1/users")
async def get_users(
    db: Database = Depends(get_database), token: str = Depends(oauth2_scheme)
):
    try:
        credentials_exception = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )
        payload = jwt.decode(token, SECRET_KEY, algorithms=[JWT_ALGORITHM])
        auth_user_name: str = payload.get("sub")
        if auth_user_name is None:
            raise credentials_exception
        auth_user_query = "SELECT role FROM user WHERE user_name = :username"
        auth_user = await db.fetch_one(
            query=auth_user_query, values={"username": auth_user_name}
        )
        if auth_user.role != "admin":
            raise HTTPException(
                status_code=401, detail=f"User not authorized to do this operation."
            )

        query = "SELECT user_name, name FROM user WHERE role = 'user'"
        users = await db.fetch_all(query=query)
        if users:
            return {"users": users}
        else:
            return {"users": []}
    except ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.exceptions.InvalidSignatureError as e:
        raise HTTPException(status_code=401, detail=f"{e}")


@app.delete("/api/v1/users/{user_name}")
async def delete_users(
    user_name: str,
    db: Database = Depends(get_database),
    token: str = Depends(oauth2_scheme),
):
    try:
        credentials_exception = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )
        payload = jwt.decode(token, SECRET_KEY, algorithms=[JWT_ALGORITHM])
        auth_user_name: str = payload.get("sub")
        if auth_user_name is None:
            raise credentials_exception
        try:
            auth_user_query = "SELECT role FROM user WHERE user_name = :username"
            auth_user = await db.fetch_one(
                query=auth_user_query, values={"username": auth_user_name}
            )
            if auth_user.role != "admin":
                raise HTTPException(
                    status_code=400, detail=f"User not authorize to do this operation"
                )

            existing_user_query = (
                "SELECT user_name FROM user WHERE user_name = :username"
            )
            existing_user = await db.fetch_one(
                query=existing_user_query, values={"username": user_name}
            )
            if existing_user == None:
                raise HTTPException(
                    status_code=404, detail=f"User '{user_name}' not found."
                )

            query = "DELETE FROM user WHERE user_name = :user_name"
            await database.execute(query=query, values={"user_name": user_name})
            return {"message": f"User '{user_name}' removed successfully."}
        except Exception as error:
            logger.error(f"An exception occurred while removing a user: {error}")
            raise HTTPException(status_code=500, detail=f"Exception occured: {error} ")
    except ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.exceptions.InvalidSignatureError as error:
        raise HTTPException(status_code=401, detail=f"{error}")


def create_access_token(data: dict):
    to_encode = data.copy()
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=JWT_ALGORITHM)
    return encoded_jwt


@app.get("/api/v1/get_auth_user")
async def get_auth_user(
    db: Database = Depends(get_database), token: str = Depends(oauth2_scheme)
):
    try:
        credentials_exception = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )
        payload = jwt.decode(token, SECRET_KEY, algorithms=[JWT_ALGORITHM])
        auth_user_name: str = payload.get("sub")
        if auth_user_name is None:
            raise credentials_exception
        auth_user_query = (
            "SELECT user_name, name, role FROM user WHERE user_name = :username"
        )
        auth_user = await db.fetch_one(
            query=auth_user_query, values={"username": auth_user_name}
        )
        return {"auth_user": auth_user}
    except ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.exceptions.InvalidSignatureError as error:
        raise HTTPException(status_code=401, detail=f"{error}")


@app.post("/api/v1/chat")
def generate_chat_message(
    input_data: InputChatModel, token: str = Depends(oauth2_scheme)
):
    try:
        credentials_exception = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )
        payload = jwt.decode(token, SECRET_KEY, algorithms=[JWT_ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        if not is_model_loaded:
            logger.error(
                f"An exception occurred while loading the model: {model_error}"
            )
            raise HTTPException(
                status_code=500,
                detail=f"An exception occurred while loading the model: {model_error}",
            )
        try:
            flag = True
            device_str = ""
            while flag:
                for gpu in gpu_list:
                    if os.environ[gpu] == "free":
                        os.environ[gpu] = "used"
                        device_str = gpu
                        flag = False
                        break
                if flag == True:
                    asyncio.sleep(10)

            inputs = tokenizer(input_data.prompt, return_tensors="pt").to(device)
            generate_ids = model.generate(inputs.input_ids, max_length=100)
            res = tokenizer.batch_decode(
                generate_ids,
                skip_special_tokens=True,
                clean_up_tokenization_spaces=False,
            )[0]
            del inputs
            del generate_ids
            if torch.cuda.is_available():
                gc.collect()
                torch.cuda.empty_cache()
                torch.cuda.ipc_collect()
            os.environ[device_str] = "free"
            return {"prompt": input_data.prompt, "response": res}
        except Exception as error:
            logger.error(f"An exception arose during result generation: {error}")
            raise HTTPException(
                status_code=500,
                detail=f"An exception arose during result generation: {error}",
            )
    except ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.exceptions.InvalidSignatureError as error:
        raise HTTPException(status_code=401, detail=f"{error}")


async def generate(request, question, device_str):
    try:
        inputs = tokenizer([question], return_tensors="pt").to(device)
        streamer = TextIteratorStreamer(tokenizer)
        generation_kwargs = dict(inputs, streamer=streamer, max_new_tokens=500)
        thread = Thread(target=model.generate, kwargs=generation_kwargs)
        thread.start()
        for new_text in streamer:
            if await request.is_disconnected():
                break
            cleaned_text = new_text.replace("\n", "<br>")
            yield f"data: {cleaned_text}\n\n"
        del streamer
        del inputs
        del generation_kwargs
        del thread
        if torch.cuda.is_available():
            gc.collect()
            torch.cuda.empty_cache()
            torch.cuda.ipc_collect()
        os.environ[device_str] = "free"
        yield f"data: [DONE]\n\n"
    except Exception as error:
        logger.error(f"An exception arose during result generation: {error}")
        yield f"An exception arose during result generation: {error}"


@app.get("/api/v1/chat_stream")
async def get_chat_stream(
    request: Request, prompt: str, token: str = Depends(oauth2_scheme)
):
    try:
        credentials_exception = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )
        payload = jwt.decode(token, SECRET_KEY, algorithms=[JWT_ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        if not is_model_loaded:
            logger.error(
                f"An exception occurred while loading the model: {model_error}"
            )
            raise HTTPException(
                status_code=500,
                detail=f"An exception occurred while loading the model: {model_error}",
            )
        flag = True
        device_str = ""
        while flag:
            for gpu in gpu_list:
                if os.environ[gpu] == "free":
                    os.environ[gpu] = "used"
                    device_str = gpu
                    flag = False
                    break
            if flag == True:
                await asyncio.sleep(10)
        return StreamingResponse(
            generate(request, prompt, device_str), media_type="text/event-stream"
        )
    except ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.exceptions.InvalidSignatureError as error:
        raise HTTPException(status_code=401, detail=f"{error}")


@app.post("/api/v1/chat_stream")
async def post_chat_stream(
    request: Request, input_data: InputChatModel, token: str = Depends(oauth2_scheme)
):
    try:
        credentials_exception = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )
        payload = jwt.decode(token, SECRET_KEY, algorithms=[JWT_ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        if not is_model_loaded:
            logger.error(
                f"An exception occurred while loading the model: {model_error}"
            )
            raise HTTPException(
                status_code=500,
                detail=f"An exception occurred while loading the model: {model_error}",
            )
        flag = True
        device_str = ""
        while flag:
            for gpu in gpu_list:
                if os.environ[gpu] == "free":
                    os.environ[gpu] = "used"
                    device_str = gpu
                    flag = False
                    break
            if flag == True:
                await asyncio.sleep(10)
                if threading.active_count() == 1:
                    await asyncio.sleep(5)
                    if threading.active_count() == 1:
                        flag = False
                        break
        return StreamingResponse(
            generate(request, input_data.prompt, device_str),
            media_type="text/event-stream",
        )
    except ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.exceptions.InvalidSignatureError as error:
        raise HTTPException(status_code=401, detail=f"{error}")


if not DEBUG:
    app.mount(
        "/", StaticFiles(directory=STATIC_FILE_PATH, html=True), name=STATIC_FILE_PATH
    )
