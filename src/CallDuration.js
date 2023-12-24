function runAnalysis() {
    const fileInput = document.getElementById('fileInput');
    const files = Array.from(fileInput.files);

    if (files.length === 0) {
        alert('Please select at least one JSON file.');
        return;
    }

    Promise.all(files.map(file => readFile(file)))
        .then(totalCallDuration => {
            const formattedDuration = formatDuration(totalCallDuration.reduce((acc, curr) => acc + curr, 0));
            logToCmdOutput(`Finished processing all files and total call duration comes out to: ${formattedDuration}`);
            document.getElementById('result').textContent = `Total call duration: ${formattedDuration}`;
        })
        .catch(error => {
            console.error('Error processing files:', error);
        });
}

function readFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = function (event) {
            try {
                const jsonData = JSON.parse(event.target.result);
                const messages = jsonData.messages || [];

                logToCmdOutput(`Processing file: ${file.name}`);

                let totalCallDuration = 0;

                for (const message of messages) {
                    if (message['call_duration']) {
                        logToCmdOutput(`Message with call_duration: ${JSON.stringify(message)}`);
                        const callDuration = message['call_duration'];
                        totalCallDuration += callDuration;
                        logToCmdOutput(`Formatted Duration: ${formatDuration(callDuration)}`);
                        logToCmdOutput(`Raw Duration: ${callDuration}`);
                    }
                }

                logToCmdOutput(`Finish processing file: ${file.name}`);
                resolve(totalCallDuration);
            } catch (error) {
                console.error('Error parsing JSON file:', file.name, error);
                reject(error);
            }
        };

        reader.readAsText(file);
    });
}

function formatDuration(seconds) {
    const days = Math.floor(seconds / (24 * 60 * 60));
    const hours = Math.floor((seconds % (24 * 60 * 60)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    return `${days} days, ${hours} hours, ${minutes} minutes, ${remainingSeconds} seconds`;
}

function logToCmdOutput(message) {
    console.log(message);
}
