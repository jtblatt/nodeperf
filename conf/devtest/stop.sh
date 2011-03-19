#! /bin/sh

BASE="../../"

kill -TERM `cat ${BASE}/conf/devtest/origin8080.pid` 2>/dev/null
kill -TERM `cat ${BASE}/conf/devtest/origin8081.pid` 2>/dev/null
kill -TERM `cat ${BASE}/conf/devtest/origin8082.pid` 2>/dev/null
kill -TERM `cat ${BASE}/conf/devtest/proxy8888.pid` 2>/dev/null

rm ${BASE}/conf/devtest/*.pid

