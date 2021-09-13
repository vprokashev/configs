# Восстановление после переустановки
```shell script
apt install curl;
curl -s https://raw.githubusercontent.com/0c70pu5/configs/master/restore.sh | bash;
```

## Команды:
```shell script
dd if=IMAGENAME.iso of=/dev/null bs=1M
```

Добавление пользователя. Параметр M в useradd не даст пересоздать домашний каталог.
```shell script
sudo useradd -d /home/USERNAME -M -s /bin/bash USERNAME
sudo passwd USERNAME
sudo usermod -aG sudo USERNAME
sudo cd /home/USERNAME
sudo chown USERNAME:USERNAME ./ -R
```

Для восстановления прав в git репе
```shell script
sudo chmod 000 ./ -R
sudo chmod u+rwX,g+rwX,o+rX,a+rX ./ -R #X, в отличии от x, будет применяться только к файлам
```

Оптимизация png. Чуть лучше чем TinyPNG
```shell script
pngquant --strip --posterize 0 --quality 0-50 -f -o ABSOLUTE_PNG_PATH ABSOLUTE_PNG_PATH
```

Включить/отключить вход от root
```shell script
sudo passwd root
sudo passwd -l root
```

Прослушиваемые порты
```
sudo netstat -tulpn | grep LISTEN
```
