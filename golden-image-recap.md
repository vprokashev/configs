# Debian Testing XFCE Golden Image

## Цель

Подготовить **Golden-образ Debian Testing + XFCE** для:
- экспериментов (AI, toolchains, system-level вещи)
- быстрого восстановления системы
- модели **reimage**, а не rollback

## Способ сборки образа

### 1. Установка debootstrap (в Ubuntu)
```bash
sudo apt update
sudo apt install debootstrap
```

### 2. Создание корня Debian Testing
```bash
sudo mkdir -p /opt/debian-golden
sudo debootstrap testing /opt/debian-golden http://deb.debian.org/debian
```

### 3. Подготовка chroot
```bash
sudo mount --bind /dev      /opt/debian-golden/dev
sudo mount --bind /dev/pts /opt/debian-golden/dev/pts
sudo mount --bind /proc    /opt/debian-golden/proc
sudo mount --bind /sys     /opt/debian-golden/sys
sudo mount --bind /run     /opt/debian-golden/run
```

Вход:
```bash
sudo chroot /opt/debian-golden /bin/bash
```

### 4. Репозитории (Debian Testing)
```bash
cat > /etc/apt/sources.list <<'EOF'
deb http://deb.debian.org/debian testing main contrib non-free non-free-firmware
deb http://security.debian.org/debian-security testing-security main contrib non-free non-free-firmware
EOF

apt update
```

Проверка:
```bash
apt-cache policy libc6
```

### 5. Базовая система
```bash
apt install -y \
  systemd-sysv \
  dbus \
  sudo \
  locales \
  tzdata \
  ca-certificates
```

### 6. Ядро Debian Testing
```bash
apt install -y linux-image-amd64
```

### 7. XFCE (минимальный набор)
```bash
apt install -y \
  xfce4 \
  xfce4-terminal \
  xfce4-session \
  xfce4-settings \
  thunar \
  gvfs \
  gvfs-backends \
  lightdm \
  lightdm-gtk-greeter
```

```bash
systemctl enable lightdm
```

### 8. Сеть и базовые сервисы
```bash
apt install -y \
  network-manager \
  openssh-server
```

```bash
systemctl enable NetworkManager
```

### 9. Пользователь и идентификация
```bash
passwd root
useradd -m -G sudo -s /bin/bash vadim
passwd vadim
```

```bash
echo debian-golden > /etc/hostname
cat > /etc/hosts <<'EOF'
127.0.0.1 localhost
127.0.1.1 debian-golden
EOF
```

### 10. Очистка перед упаковкой
```bash
apt clean
rm -rf /var/cache/apt/*
rm -rf /tmp/*
```

### 11. Выход из chroot и размонтирование
```bash
exit
```
```bash
sudo umount /opt/debian-golden/dev/pts
sudo umount /opt/debian-golden/dev
sudo umount /opt/debian-golden/proc
sudo umount /opt/debian-golden/sys
sudo umount /opt/debian-golden/run
```

### 12. Сборка golden-образа
```bash
sudo tar \
  --numeric-owner \
  --xattrs \
  --acls \
  -cpf - \
  -C /opt/debian-golden . \
| zstd -19 -T0 > debian-testing-xfce-golden.tar.zst
```

## System Rescue
Закатать на флешку [System Rescue](https://www.system-rescue.org/Download/) 
```bash
sudo dd if=systemrescue-12.03-amd64.iso of=/dev/xxx bs=4M status=progress oflag=sync
```
Проверка дисков - `lsblk`

## Reimage

### 1. Определяем диски (ОБЯЗАТЕЛЬНО)
```bash
lsblk -o NAME,SIZE,FSTYPE,MOUNTPOINTS,MODEL
```

### 2. ⚠️ ЭТА КОМАНДА СТИРАЕТ ВСЮ LINUX-СИСТЕМУ
```bash
mkfs.ext4 -F /dev/xxx
```

### 3. Монтирование разделов
```bash
mount /dev/xxx /mnt
mkdir -p /mnt/boot
mount /dev/xxx /mnt/boot
```

### 4. Восстановление Golden-образа
Найти куда смонтировалась флешка с образом, либо смонтировать самому. Например тут - `/run/media/root/RESCUE_DATA`
```bash
mkdir /usb
mount /dev/sdb1 /usb
```
```bash
zstd -d < /usb/debian-testing-xfce-golden.tar.zst \
| tar --numeric-owner --xattrs --acls -xpf - -C /mnt
```
### 5. Проверка (быстро)
```bash
ls /mnt
ls /mnt/boot
```
Ты должен увидеть:
* /mnt/bin
* /mnt/etc
* /mnt/usr
* /mnt/boot/vmlinuz-*

### 6. Финал
```bash
sync
reboot
```

## Initial install

## Целевая схема диска

    Linux SSD (GPT)
    ├─ EFI   512 MB   FAT32   → /boot
    └─ ROOT  остальное ext4  → /

Пример устройств:

    DISK=/dev/nvme1n1
    EFI=/dev/nvme1n1p1
    ROOT=/dev/nvme1n1p2

## 0. Проверка дисков (ОБЯЗАТЕЛЬНО)

Перед любыми действиями:

    lsblk -o NAME,SIZE,FSTYPE,MODEL

Убедись, что:
- выбран Linux-диск
- Windows-диск не используется

Если есть сомнения — СТОП.

## 1. Разметка диска (GPT)

⚠️ СТИРАЕТ ВСЕ ДАННЫЕ НА DISK

    fdisk /dev/xxx

Внутри fdisk:

    g        # создать GPT

    n        # EFI
    1
    <Enter>
    +512M

    t
    1        # EFI System

    n        # ROOT
    2
    <Enter>
    <Enter>

    w        # записать изменения

## 2. Форматирование разделов

### EFI
    mkfs.vfat -F32 /dev/xxx1

### ROOT
    mkfs.ext4 -F /dev/xxx2

## 3. Монтирование

    mount /dev/xxx2 /mnt
    mkdir -p /mnt/boot
    mount /dev/xxx1 /mnt/boot

Проверка:

    lsblk

Ожидаемо:

    xxx2  ext4  /mnt
    xxx1  vfat  /mnt/boot

## 4. Распаковка golden-образа

    zstd -d < /path/to/debian-testing-xfce-golden.tar.zst \
    | tar --numeric-owner --xattrs --acls -xpf - -C /mnt

## 5. Подготовка chroot

    mount --bind /dev  /mnt/dev
    mount --bind /proc /mnt/proc
    mount --bind /sys  /mnt/sys
    mount --bind /run  /mnt/run

    chroot /mnt /bin/bash

## 6. Установка GRUB (UEFI)

    apt update
    apt install -y grub-efi-amd64

    grub-install \
      --target=x86_64-efi \
      --efi-directory=/boot \
      --bootloader-id=Debian

    update-grub

Результат:
- создана EFI-запись
- ядро добавлено в GRUB
- система стала загрузочной

## 7. Завершение

    exit
    umount -R /mnt
    reboot

Извлеки флешку.

## После первого запуска

Система должна:
- загрузиться в GRUB
- показать LightDM
- войти в XFCE

С этого момента:
- EFI НЕ форматируется
- загрузчик НЕ переустанавливается
- используется только reimage
