#!/bin/bash

# Minecraft version
VERSION=1.16.5

set -e
root=$PWD

#export JAVA_HOME=/usr/lib/jvm/java-1.11.0-openjdk-amd64
#export PATH=$JAVA_HOME/bin:$PATH

download() {
    set -e

    wget -O ngrok.zip https://bin.equinox.io/c/4VmDzA7iaHb/ngrok-stable-linux-amd64.zip
    unzip -o ngrok.zip
    rm -rf ngrok.zip
    echo "Download complete" 

    clear
}

require() {
    if [ ! $1 $2 ]; then
        echo $3
        echo "Running download..."
        
    fi
}
require_file() { require -f $1 "File $1 required but not found"; }
require_dir()  { require -d $1 "Directory $1 required but not found"; }
require_env()  {
    var=`python3 -c "import os;print(os.getenv('$1',''))"`
    if [ -z "${var}" ]; then
        echo "Environment variable $1 not set. "
        echo "Make a new secret called $1 and set it to $2"
        exit
    fi
    eval "$1=$var"
}
require_executable() {
    require_file "$1"
    chmod +x "$1"
}

# server files
require_file "eula.txt"
require_file "server.properties"
require_file "minecraftjars/papermc.jar"
# java
#require_dir "jre"
#require_executable "jre/bin/java"
# ngrok binary
require_executable "ngrok"

# environment variables
mkdir -p ./logs
touch ./logs/temp # avoid "no such file or directory"
rm ./logs/*
./ngrok authtoken 1t3ZZQ0D8wHGtRVAjkLyNNNe23q_6UabtZF5a4F4npB3bryEK &
touch logs/ngrok.log
./ngrok tcp --log=stdout 25565 > ./logs/ngrok.log &
# wait for started tunnel message, and print each line of file as it is written
tail -f ./logs/ngrok.log | sed '/started tunnel/ q'
orig_server_ip=`curl --silent http://127.0.0.1:4040/api/tunnels | jq '.tunnels[0].public_url'`
trimmed_server_ip=`echo $orig_server_ip | grep -o '[a-zA-Z0-9.]*\.ngrok.io[0-9:]*'`
server_ip="${trimmed_server_ip:-$orig_server_ip}"
echo "Server IP is: $server_ip"
echo "Server running on: $server_ip" > $root/ip.txt
&
touch logs/latest.log
# Experiment: Run http server after all ports are opened
#( tail -f ./logs/latest.log | sed '/RCON running on/ q' && python3 -m http.server 8080 ) &

./node_modules/.bin/lt --port 80 --subdomain minserver2 &

# Start minecraft
#PATH=$PWD/jre/bin:$PATH
clear 
echo "Running server..."
chmod 777 -R .
./jdk16/jdk-16.0.2/bin/java -Xmx2G -Xms2G -jar minecraftjars/papermc.jar 
./Main.sh