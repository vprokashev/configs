https://developer.okta.com/blog/2021/07/07/developers-guide-to-gpg#enable-your-gpg-key-for-ssh  
https://support.yubico.com/hc/en-us/articles/360013790259-Using-Your-YubiKey-with-OpenPGP  
https://developers.yubico.com/PGP/SSH_authentication/Windows.html  
https://www.jetbrains.com/help/clion/2023.1/set-up-GPG-commit-signing.html#configure-the-environment  

Before generating keys make sure you tweaked next options on your card: name, url, login, lang, passwd, key-attr  
If you don't save the public key, you won't be able to use the private one. The public key ISN'T stored on the card, and the private key cannot be exported.

1) Install latest Git
2) Create folder ```mkdir C:\Users\<User_name>\.gnupg```. For bash it would be like ```mkdir ~/.gnupg```. Cd here
3) (Optional) For Yubikey supporting create ```echo "reader-port Yubico Yubi" >> ./scdaemon.conf```
4) For SSH integration create 2 files:  

gpg.conf
```txt
use-agent
```
gpg-agent.conf
```txt
enable-ssh-support
enable-win32-openssh-support
use-standard-socket
default-cache-ttl 600
max-cache-ttl 7200
```
5) Create file sshcontrol by the doc
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

