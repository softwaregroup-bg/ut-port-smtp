require('ut-run').run({
    main: require('..'),
    method: 'unit',
    config: {
        smtp: {
            port: 8025,
            hook: 'smtpSim',
            server: {
                disabledCommands: ['STARTTLS']
            }
        }
    },
    params: {
        steps: []
    }
});
