https://ubuntu.com/tutorials/install-and-configure-samba#4-setting-up-user-accounts-and-connecting-to-share

```bash
sudo apt update
sudo apt install samba
mkdir /home/<username>/sambashare/
sudo emacs -nw /etc/samba/smb.conf
```
add
```
[sambashare]
    comment = Samba on Ubuntu
    path = /home/username/sambashare
    read only = no
    browsable = yes
```
```bash
sudo service smbd restart
sudo ufw allow samba
```
