#! /bin/sh

BASE="../../"
NODE="${BASE}/submodules/joyent/node/node"

${BASE}/conf/devtest/stop.sh 2>/dev/null

# trap SIGINT and SIGTERM
#$trap 'kill -s 15 < origin8080.pid' 2 15

nohup ${NODE} ${BASE}/src/servers/origin.js ${BASE}/conf/devtest/origin8080.json > ${BASE}/conf/devtest/origin8080.log &
echo "$!" > ${BASE}/conf/devtest/origin8080.pid

nohup ${NODE} ${BASE}/src/servers/origin.js ${BASE}/conf/devtest/origin8081.json > ${BASE}/conf/devtest/origin8081.log &
echo "$!" > ${BASE}/conf/devtest/origin8081.pid

nohup ${NODE} ${BASE}/src/servers/origin.js ${BASE}/conf/devtest/origin8082.json > ${BASE}/conf/devtest/origin8082.log &
echo "$!" > ${BASE}/conf/devtest/origin8082.pid

nohup ${NODE} ${BASE}/src/servers/proxy.js ${BASE}/conf/devtest/proxy8888.json > ${BASE}/conf/devtest/proxy8888.log &
echo "$!" > ${BASE}/conf/devtest/proxy8888.pid

sleep 1

echo "---- origin8080 ----"
echo "${NODE} ${BASE}/src/servers/origin.js ${BASE}/conf/devtest/origin8080.json"
tail ${BASE}/conf/devtest/origin8080.log

sleep 1

echo "---- origin8081 ----"
echo "${NODE} ${BASE}/src/servers/origin.js ${BASE}/conf/devtest/origin8081.json"
tail ${BASE}/conf/devtest/origin8081.log

sleep 1

echo "---- origin8082 ----"
echo "${NODE} ${BASE}/src/servers/origin.js ${BASE}/conf/devtest/origin8082.json"
tail ${BASE}/conf/devtest/origin8082.log

sleep 1

echo "---- proxy8888 ----"
echo "${NODE} ${BASE}/src/servers/proxy.js ${BASE}/conf/devtest/proxy8888.json"
tail ${BASE}/conf/devtest/proxy8888.log
