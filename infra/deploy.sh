#!/bin/bash
server=jexner.tiliah.com
user=tiliah
port=2288
# dir=$(pwd)
# (basename $dir)
projectname=template-tiliah-django
remote_path=/home/tiliah/${projectname}

ssh="ssh -p $port -o StrictHostKeyChecking=no -l $user"

cleanup(){
  RET=${1:-"2"}
  exit $RET
}

trap "cleanup" SIGINT
trap "cleanup" EXIT

# ensure exists
echo "============= 1. connect to $server and create $remote_path ============="
$ssh $server "mkdir -p $remote_path"

# push code
echo "============= 2. push code (if asked enter your local machine's password) ============="
rsync -rv -e "$ssh" \
  --exclude '*venv*' \
  --exclude '*node_modules*' \
  --delete \
  $(dirname "$BASH_SOURCE")/../docker-compose.yml \
  $user@$server:$remote_path \

if [ "$#" -gt 0 ] && {  [ "$1" = "--just-rsync" ] || [ "$1" = "-jr" ]; }; then
  echo "============= skipping build and push ============="
else
  echo "============= 3. building docker image no-cache ============="
  # build locally
  docker build --tag ${projectname}:prod --file ./Dockerfile --no-cache .

  echo "============= 4. 1/3 save docker image ============="
  IMAGE=${projectname}.tar.gz
  docker save ${projectname}:prod | pigz -5 > $IMAGE
  echo "============= 5. 2/3 send image to server ============="
  rsync -rv --progress -e "$ssh" $IMAGE $user@$server:$remote_path/
  echo "============= 6. 3/3 server load image ============="
  $ssh $server "docker load -i $remote_path/$IMAGE"
  rm $IMAGE
  $ssh $server "rm $remote_path/$IMAGE"
fi
  

  # stop containers
  echo "============= 7. stop docker ============="
  $ssh $server "cd $remote_path && docker compose -f docker-compose.yml stop"

  # run code
  echo "============= 8. run docker ============="
  $ssh $server "cd $remote_path && docker compose -f docker-compose.yml up -d"


# .env should be created on the server imho

echo "deployment done: $server"
exit