#!/usr/bin/env bash

# Останавливаем при ошибках
set -e

echo "→ Converting all text files to LF..."

# Переводим CRLF → LF во всех отслеживаемых файлах
git ls-files -z | while IFS= read -r -d '' file; do
    # Пропускаем бинарные файлы
    if git check-attr text -- "$file" | grep -q "unspecified"; then
        continue
    fi
    if git check-attr text -- "$file" | grep -q "set"; then
        # нормализуем строковые окончания
        sed -i 's/\r$//' "$file"
    fi
done

echo "→ Staging normalized files..."
git add -u

echo "→ Done. Commit changes manually:"
echo "   git commit -m \"Normalize all files to LF\""
