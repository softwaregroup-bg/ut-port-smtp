require('ut-run').run({
    main: require('..'),
    method: 'unit',
    config: {
        smtp: {
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
