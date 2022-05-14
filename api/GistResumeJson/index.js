const https = require('https');

function getPromise(options) {
    return new Promise((resolve, reject) => {
        https.get(options, (response) => {
            let chunks_of_data = [];

            response.on('data', (fragments) => {
                chunks_of_data.push(fragments);
            });

            response.on('end', () => {
                let response_body = Buffer.concat(chunks_of_data);
                resolve(response_body.toString());
            });

            response.on('error', (error) => {
                reject(error);
            });
        });
    });
}
async function makeSynchronousRequest(options) {
    try {
        let http_promise = getPromise(options);
        let response_body = await http_promise;

        // holds response from server that is passed when Promise is resolved
        return response_body;
    } catch (error) {
        // Promise rejected
        console.log(error);
    }
}
module.exports = async function(context, req) {
    var options = {
        host: 'api.github.com',
        path: '/users/' + req.params.id + '/gists',
        method: 'GET',
        headers: {
            'user-agent': 'node.js'
        }
    };
    try {
        let data = await makeSynchronousRequest(options);
        var res = JSON.parse(data).find(item => {
            return (item.files["resume.json"]);
        });

        var raw_url = res.files["resume.json"].raw_url;
        options = {
            host: "gist.githubusercontent.com",
            path: raw_url.replace("https://gist.githubusercontent.com/", ""),
            method: 'GET',
            headers: {
                'user-agent': 'node.js'
            }
        };

        data = await makeSynchronousRequest(options);
        context.res.status(200).json(data);
    } catch (error) {
        context.res.status(500).send(error);
    }
};