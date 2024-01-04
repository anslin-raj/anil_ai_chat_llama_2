import os
import gc
import torch
import secrets
import logging
import pyfiglet
import transformers
from torch import cuda
from datetime import datetime
from transformers import AutoModelForCausalLM, AutoTokenizer
from transformers import logging as hf_logging

from config import *


def get_banner(text, version):
    parts = pyfiglet.figlet_format(text, font="big").rsplit("\n")
    if len(parts) >= 4:
        parts[-4] = f"{parts[-4]} {version}"
        return "\n".join(parts[:-2])
    return text


def get_formatted_time():
    current_time = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S %z")
    return f"[{current_time}+0000]"


def main():
    print(get_banner(MODULE_NAME, MODULE_VERSION))
    hf_logging.set_verbosity_error()
    transformer_logger = logging.getLogger("transformers")
    transformer_logger.setLevel(logging.ERROR)
    transformers.utils.logging.disable_progress_bar()

    device = f"cuda:{cuda.current_device()}" if cuda.is_available() else "cpu"
    print(f"{get_formatted_time()} [{os.getpid()}] [INFO] Device using: {device}")
    print(
        f'{get_formatted_time()} [{os.getpid()}] [INFO] Cloning model "{HF_MODEL_REPO}" from Hugging Face...'
    )
    try:
        tokenizer = AutoTokenizer.from_pretrained(HF_MODEL_REPO, device=device)
        model = AutoModelForCausalLM.from_pretrained(
            HF_MODEL_REPO, device_map=device, load_in_8bit=True
        )
        del tokenizer
        del model
    except Exception as error:
        print(
            f"{get_formatted_time()} [{os.getpid()}] [ERROR] An exception occurred while cloning the model: {error}"
        )
        exit(1)
    print(f'{get_formatted_time()} [{os.getpid()}] [INFO] Model "{HF_MODEL_REPO}" cloned successfully.')

    if torch.cuda.is_available():
        gc.collect()
        torch.cuda.empty_cache()
        torch.cuda.ipc_collect()

    if os.environ.get("SECRET_KEY", "None") == "None" and not os.path.exists(
        "/app/secret_key.txt"
    ):
        token_string = secrets.token_hex(16)
        with open("/app/secret_key.txt", "w") as env_file:
            env_file.write(token_string)
    exit(0)


if __name__ == "__main__":
    main()
