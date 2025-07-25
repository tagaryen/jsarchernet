const http = require('http');


//隐私求教测试连接器添加项目接口
function testAddProject() {
    let param = {
        hostname: '127.0.0.1',
        port: 9607,
        path: '/api/v1alpha1/p2p/project/adapter-create',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'user-token': '1b32a1cdad2249a8a7e748499845abe6'
        },
    };
    let req = http.request(param, (res) => {
        let body = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
            body += chunk;
        });
        res.on('end', () => {
            console.log(body);
        });
    });
    req.on('error', (err) => {
        console.log("error", err);
    })

    let body = {
        "columns": [
            {
                "colComment": "",
                "colName": "id",
                "colType": "int"
            },
            {
                "colComment": "",
                "colName": "name",
                "colType": "varchar"
            }
        ],
        "dataSourceInfo": {
            "database": "alice",
            "endpoint": "10.32.122.172:3306",
            "password": "123456",
            "user": "root"
        },
        "dataSourceName": "alice",
        "dataSourceType": "MYSQL",
        "datatableName": "kine",
        "nodeIds": [
            "d21666"
        ],
        "ownerId": "bjreboxc",
        "projectId": "kcbdupty",
        "relativeUri": "kine"
    }
    ;
    req.write(JSON.stringify(body));
    req.end();
}

testAddProject();