const smtpServer = require('smtp-server');
const through2 = require('through2');

module.exports = ({utPort}) => class smtp extends utPort {
    get defaults() {
        return {
            type: 'smtp',
            namespace: [
                'smtp'
            ],
            server: {
                disableReverseLookup: true
            },
            port: 25,
            host: undefined
        };
    }

    async start() {
        const result = await super.start(...arguments);
        const stream = this.pull(false, {requests: {}});
        const meta = (method, callback) => ({
            mtid: 'request',
            method: (this.config.hook || this.config.id) + '.' + method,
            reply: (result, $meta) => {
                if (!$meta || $meta.mtid === 'error') {
                    callback && callback(result);
                }
                callback && callback(undefined, result);
            }
        });
        this.server = new smtpServer.SMTPServer({
            ...this.config.server,
            onAuth: (auth, session, callback) => {
                stream.push([
                    {auth, session},
                    meta('identity.check', callback)
                ]);
            },
            onConnect: (session, callback) => {
                this.fireEvent('connection', {session}, 'asyncMap')
                    .then(() => callback())
                    .catch(error => callback(error));
            },
            onClose: (session) => {
                this.fireEvent('connectionClose', {session}, 'asyncMap')
                    .catch(error => this.error(error));
            },
            onData: (data, session, callback) => {
                data
                    .on('end', callback)
                    .pipe(through2((chunk, enc, done) => {
                        stream.push([
                            {chunk, enc, session},
                            meta('mail.stream', () => done())
                        ]);
                    }));
            }

        });
        this.server.on('error', error => this.error(error));
        return new Promise((resolve, reject) => {
            this.server.listen(this.config.port, this.config.host, error => {
                error ? reject(error) : resolve(result);
            });
        });
    }

    async stop() {
        this.server && await new Promise(resolve => {
            this.server.close(error => {
                if (error) this.error(error);
                resolve();
            });
        });
        return super.stop(...arguments);
    }
};
