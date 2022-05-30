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
sudo chown -R user:group /home/user/dir/
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
sudo lsof -n -i :2022 | grep LISTEN
```

Поиск
```
find / -type f -exec grep -H 'text-to-find-here' {} \;
grep -rnw '/path/to/somewhere/' -e 'pattern'
```

windows format
as admin
```
diskpart
list disk
select disk x //number in table above
clean
create partition primary
list partition
select partition y //number in table above
format quick fs=fat32 unit=32k 
assign
```

orico 
https://ubuntuforums.org/showthread.php?t=2453631&p=14006235#post14006235
https://gist.github.com/rometsch/dfd24fb09c85c1ad2f25223dc1481aaa#gistcomment-3709943

Openssl pkcs12 -in FileName.pfx -nocerts -out FileName.pem -nodes
openssl rsa -in ./FileName.pem -out ./FileName.pem -aes256
openssl pkcs12 -in FileName.pfx -nokeys -out FileName.crt -nodes
