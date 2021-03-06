const stripAnsi = require('strip-ansi');
const nodemailer = require('nodemailer');

class DocumentTestHooksReporter {
    /**
     * constructor for the reporter
     *
     * @param {Object} globalConfig - Jest configuration object
     * @param {Object} options - Options object defined in jest config
     */
    constructor(globalConfig, options) {
        if (!options.from) {
            throw new Error('\nPlease set a from-field for jest-email-reporter in jest.config.js')
        }

        if (!options.to) {
            throw new Error('\nPlease set a to-field for jest-email-reporter in jest.config.js')
        }

        // Default transporter options
        this._transporterOptions = {
            "sendmail": true,
            "newline": 'unix',
            "path": '/usr/sbin/sendmail'
        }
        if (options.transporter != undefined) {
            this._transporterOptions = Object.assign(this._transporterOptions, options.transporter)
        }

        this._emailOptions = {
            from: options.from,
            to: options.to,
            subject: options.subject || 'Test results',
        };

        this._reportIfSuccess = options.reportIfSuccess || false;
    }

    /**
     * Hook to process the test run before running the tests, the only real data
     * available at this time is the number of test suites about to be executed
     *
     * @param {JestTestRunResult} - Results for the test run, but only `numTotalTestSuites` is of use
     * @param {JestRunConfig} - Run configuration
     */
    onRunStart(runResults, runConfig) {
        // console.log(`onRunStart arguments: ${JSON.stringify(arguments)}`);
    }

    /**
     * Hook to process the test run results after a test suite has been executed
     * This will be called many times during the test run
     *
     * @param {JestTestSuiteRunConfig} testRunConfig - Context information about the test run
     * @param {JestTestSuiteResult} testResults - Results for the test suite just executed
     * @param {JestTestRunResult} - Results for the test run at the point in time of the test suite being executed
     */
    onTestResult(testRunConfig, testResults, runResults) {
        // console.log(`onTestResult arguments: ${JSON.stringify(arguments)}`);
    }

    /**
     * Hook to process the test run results after all the test suites have been
     * executed
     *
     * @param {string} test - The Test last run
     * @param {JestTestRunResult} - Results from the test run
     */
    onRunComplete(test, runResults) {
        // collect failure messages
        const failureMessages = runResults.testResults.reduce((acc, { failureMessage }) => {
            if (failureMessage) {
                acc.push(stripAnsi(failureMessage))
            }

            return acc;
        }, []);

        function errorSendMail(err, info) {
            console.log(info.envelope);
            console.log(info.messageId);
        }

        // send messages by e-mail
        let transporter = nodemailer.createTransport(this._transporterOptions);
        if (failureMessages.length) {
            transporter.sendMail(Object.assign({},this._emailOptions,
                     { html: `<pre>${failureMessages.join('<br /><br />')}</pre>` }
                     , errorSendMail)
            )
        } else if (this._reportIfSuccess) {
            transporter.sendMail(Object.assign({},this._emailOptions,
                { html: `<pre>Tests is success</pre>` }
                , errorSendMail)
            )
        }
    }
}

module.exports = DocumentTestHooksReporter;
