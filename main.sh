#!/bin/bash

model_repo=$(python3 -c 'import config; print(config.HF_MODEL_REPO)')
pattern=$(echo "$model_repo" | cut -d'/' -f2)

dir_found=false
for dir in ~/.cache/huggingface/hub/*; do
    if [[ $(basename "$dir") == *"$pattern"* ]]; then
        dir_found=true
        break
    fi
done

if ! $dir_found; then
    python3 script.py
    if [ $? -ne 0 ]; then
        exit 1
    fi
fi

gunicorn main:app --workers 1 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8020
