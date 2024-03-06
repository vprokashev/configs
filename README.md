# Восстановление после переустановки
```shell script
apt install curl;
curl -s https://raw.githubusercontent.com/vprokashev/configs/master/restore.sh | bash;
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

Ports
```
sudo netstat -tulpn | grep LISTEN
sudo lsof -n -i :2022 | grep LISTEN
```

Grep and find
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

git
```
git show [commit] -U30 // 30 lines before and after
git checkout HEAD -- [full_path] // rollback file
git branch -r // remote branches
git push origin --delete test // delete remote branch
```

ffmpg
```
.\ffmpeg.exe -ss 00:00:00 -to 00:02:41 -i .\source.mp4 .\target.mp4 // cut out the middle
.\ffmpeg.exe -i .\source.mp4 -c copy -an .\target-soundless.mp4 // cut out sound
```

Npm login
```
npm login --registry https://<registry_url>/<api_path>/ --scope=@<org>
```

.npmrc (C:\Users\<User>\AppData\Roaming)
```
@<scope_name>:registry=<full_url>
//<registry_url>:_password=<BASE64_PASSWORD>
//<registry_url>:username=<USERNAME>
//<registry_url>:email=youremail@email.com
//<registry_url>:always-auth=true
```

$env:NODE_OPTIONS = "--openssl-legacy-provider"

package.json with cjs and esm support
examples: "DynamoDB OneTable", "OneTable Migrate", "OneTable"
```
"main": "dist/cjs/index.js",
"module": "dist/mjs/index.js",
"exports": {
    ".": {
        "import": "./dist/mjs/index.js",
        "require": "./dist/cjs/index.js"
    }
},
```

chrome
```
"C:\Program Files\Google\Chrome\Application\chrome.exe" --no-sandbox --disable-gpu-watchdog --gpu-startup-dialog --user-data-dir="C:\chrome_debug"
```
