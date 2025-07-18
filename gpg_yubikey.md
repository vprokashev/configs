# Yubikey GPG
Todo: 
  * Split into 3 scenarios. 1 Generate and configure a key. 2 Use an existing key on a 2nd device. 3 Configure Git.

https://developer.okta.com/blog/2021/07/07/developers-guide-to-gpg#enable-your-gpg-key-for-ssh  
https://support.yubico.com/hc/en-us/articles/360013790259-Using-Your-YubiKey-with-OpenPGP  
https://developers.yubico.com/PGP/SSH_authentication/Windows.html  
https://www.jetbrains.com/help/clion/2023.1/set-up-GPG-commit-signing.html#configure-the-environment  
https://learn.microsoft.com/en-us/windows/wsl/connect-usb  

Notes:
* Before generating keys make sure you tweaked next options on your card: name, url, login, lang, passwd, key-attr  
* If you don't save the public key, you won't be able to use the private one. The public key ISN'T stored on the card, and the private key cannot be exported.  
* My public key https://github.com/vprokashev.gpg. Use the 'fetch' command from the card to pull the public part. After this action the 'keygrip' will be available  

How to start:
1) Install latest Git
2) Create folder ```mkdir C:\Users\<User_name>\.gnupg```. For bash it would be like ```mkdir ~/.gnupg```. Cd here
3) (Optional) For Yubikey supporting create ```echo "reader-port Yubico Yubi" >> ./scdaemon.conf```
4) For SSH integration create 2 files:  

gpg.conf
```bash
echo "use-agent" >> ./gpg.conf
```
gpg-agent.conf
```bash
cat << EOF > gpg-agent.conf
enable-ssh-support
enable-win32-openssh-support
use-standard-socket
default-cache-ttl 600
max-cache-ttl 7200
EOF
```
5) Create file sshcontrol by the doc. (TODO: keygrip appears after both parts of key have been generated. Check the order of the steps)
```bash
echo {keygrip [A]} >> ~/.gnupg/sshcontrol
```
6) Run script
```bash
#.bash_profile
export SSH_AUTH_SOCK=$(gpgconf --list-dirs agent-ssh-socket)
gpgconf --launch gpg-agent
gpg-connect-agent /bye
export GPG_TTY=$(tty)
```
```cmd
for /f "delims=" %%i in ('gpgconf --list-dirs agent-ssh-socket') do set SSH_AUTH_SOCK=%%i
gpgconf --launch gpg-agent
gpg-connect-agent /bye
for /f "delims=" %%i in ('tty') do set GPG_TTY=%%i
```
```cmd
start "PyCharm" "C:\Users\[user_name]\AppData\Local\Programs\PyCharm Community\bin\pycharm64.exe"
```
7) Add changes to .gitconfig by the doc
8) Generate keys in card
9) Copy public key for SSH and GPG on GitHub

Usefull commands: 
```sh
gpg --list-secret-keys --with-keygrip
gpg --card-edit
gpg --armor --export > public-keys.asc
ssh-add -L
```

![gpg-card-status-response](https://github.com/vprokashev/configs/assets/11475496/ed7951dc-daed-4d24-aaa7-11da0e988da2)

![my settings example](https://github.com/user-attachments/assets/1fceb38c-9b00-451c-a12e-d6d93852e593)


## Ubuntu 24.04.2
https://blog.markushuber.org/2024/09/12/yubikeys-with-gnupg-on-ubuntu-24-04/
Issue:
```bash
gpg --card-status
gpg: selecting card failed: No such device
gpg: OpenPGP card not available: No such device
```
Resolve:
1) Install
```bash
sudo apt install gnupg2 libpcsclite1 pcscd scdaemon
sudo systemctl enable --now pcscd
```
2) Add
```
cat .gnupg/scdaemon.conf

disable-ccid
pcsc-shared
```
3)
```
sudo pkill -9 gpg-agent
```
4) check
```
gpg --card-status
```
