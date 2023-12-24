let info = {
    "callDuration": 0,
    "mostUsedEmojis": [],
    "timesStartedCall": [],
    "mostUsedWords": [],
    "mostActiveDay": [],
    "wordCount": []
};

function runAnalysis() {
    const fileInput = document.getElementById('fileInput');
    const files = Array.from(fileInput.files);

    if (files.length === 0) {
        alert('Please select at least one JSON file.');
        return;
    }

    info = {
        "callDuration": 0,
        "mostUsedEmojis": [],
        "timesStartedCall": [],
        "mostUsedWords": [],
        "mostActiveDay": [],
        "wordCount": []
    };

    Promise.all(files.map(file => readFile(file)))
        .then(results => {
            document.getElementById('callDuration').textContent = `Total call duration: ${getCallDuration(info.callDuration)}`;
            document.getElementById('mostUsedEmojis').textContent = info.mostUsedEmojis.join(', ');
            document.getElementById('timesStartedCall').textContent = `Amount of calls started per user: ${Object.entries(info.timesStartedCall).map(([key, value]) => `${key}: ${value.count}`).join(', ')}`
            document.getElementById('mostUsedWords').textContent = Object.entries(info.mostUsedWords).map(([key, value]) => `${key}: ${value.count}`).join(', ');

            const mostActiveDayObject = info.mostActiveDay.reduce((max, obj) => obj.count > max.count ? obj : max);
            info.mostActiveDay = { day: mostActiveDayObject.day, count: mostActiveDayObject.count }
            document.getElementById('mostActiveDay').textContent = `Your most active day is ${info.mostActiveDay.day} with ${info.mostActiveDay.count} messages sent.`;
            // document.getElementById('wordCount').textContent = `Total words sent per user: ${JSON.stringify(info.wordCount)}`;
        })
        .catch(error => {
            console.error('Error processing files:', error);
        });
}

function logToCmdOutput(message) {
    console.log(message);
}

function readFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = function (event) {
            try {
                const jsonData = JSON.parse(event.target.result);
                logToCmdOutput(`Processing file: ${file.name}`);

                // Call other functions and store their results in the info object
                const totalCallDuration = getAllCallDurations([jsonData]);
                const mostUsedEmojis = getMostUsedEmojis([jsonData], 10);
                const mostUsedWords = getMostUsedWords([jsonData], 10);
                const timesStartedCall = getTimesStartedCall([jsonData]);
                const mostActiveDay = getMostActiveDay([jsonData]);
                // const wordCount = getWordCount([jsonData]);

                // Update the info object with additional information
                info.callDuration += totalCallDuration;
                info.mostUsedEmojis.push(mostUsedEmojis); // Use push to add to the array

                for (const [key, value] of Object.entries(mostUsedWords)) {
                    if (!info.mostUsedWords[replacePolishCharacters(key)]) {
                        info.mostUsedWords[replacePolishCharacters(key)] = value;
                    }
                    else {
                        info.mostUsedWords[replacePolishCharacters(key)].count += value.count;
                    }
                }


                for (const [key, value] of Object.entries(timesStartedCall)) {
                    if (!info.timesStartedCall[replacePolishCharacters(key)]) {
                        info.timesStartedCall[replacePolishCharacters(key)] = value;
                    }
                    else {
                        info.timesStartedCall[replacePolishCharacters(key)].count += value.count;
                    }
                }

                info.mostActiveDay.push(mostActiveDay);

                // info.wordCount.push(wordCount);
                // for (const [key, value] of Object.entries(info.wordCount)) {
                //     let name = value.name
                //     console.log
                //     if (!info.wordCount[replacePolishCharacters(name)]) {
                //         info.wordCount[replacePolishCharacters(name)] = value;
                //     }
                //     else {
                //         info.wordCount[replacePolishCharacters(key)].count += value.count;
                //     }
                // }
                // console.log(info.wordCount, "info.wordCount")

                logToCmdOutput(`Finish processing file: ${file.name}`);
                resolve(jsonData);
            } catch (error) {
                console.error('Error parsing JSON file:', file.name, error);
                reject(error);
            }
        };

        reader.readAsText(file, 'UTF-8');
    });
}

function replacePolishCharacters(input) {
    const replacements = {
        '\u00c5\u0082': 'ł',
        '\u00c4\u0085': 'ą',
        '\u0119': 'ę',
        '\u00c4\u0087': 'ć',
        '\u0144': 'ń',
        '\u00c5\u0084': 'ń',
        '\u00c3\u00b3': 'ó',
        '\u015b': 'ś',
        '\u017a': 'ź',
        '\u017c': 'ż',
        '\u00c5\u0081': 'Ł',
        '\u00c4\u0084': 'Ą',
        '\u0118': 'Ę',
        '\u00c4\u0086': 'Ć',
        '\u0143': 'Ń',
        '\u00d3': 'Ó',
        '\u015a': 'Ś',
        '\u0179': 'Ź',
        '\u017b': 'Ż',
        '\u00c5\u009b': 'ś',
    };

    for (const [unicode, replacement] of Object.entries(replacements)) {
        input = input.replace(new RegExp(unicode, 'g'), replacement);
    }

    return input;
}

function getAllCallDurations(results) {
    const messages = results[0].messages || [];
    let totalCallDuration = 0;
    for (const message of messages) {
        if (message['call_duration']) {
            const callDuration = message['call_duration'];
            totalCallDuration += callDuration;
        }
    }

    return totalCallDuration;
}


function getCallDuration(seconds) {
    const days = Math.floor(seconds / (24 * 60 * 60));
    const hours = Math.floor((seconds % (24 * 60 * 60)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    return `${days} days, ${hours} hours, ${minutes} minutes, ${remainingSeconds} seconds`;
}

function getMostUsedEmojis(results, topCount) {
    const emojiRegex = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g; // Regular expression to match Unicode emojis

    let emojiCounts = {};

    for (const message of results[0].messages) {
        const content = message.content || '';
        const emojis = content.match(emojiRegex) || [];

        for (const emoji of emojis) {
            emojiCounts[emoji] = (emojiCounts[emoji] || 0) + 1;
        }
    }

    const sortedEmojis = Object.entries(emojiCounts)
        .sort(([, countA], [, countB]) => countB - countA)
        .map(([emoji]) => emoji)
        .slice(0, topCount);

    return sortedEmojis
}

function getTimesStartedCall(results) {
    const timesStartedCall = {};

    for (const result of results) {
        const messages = result.messages || [];

        for (const message of messages) {
            if (message.call_duration) {
                const userName = message.sender_name;

                if (!timesStartedCall[userName]) {
                    timesStartedCall[userName] = { count: 0 };
                }
                timesStartedCall[userName].count++;
            }
        }
    }

    return timesStartedCall;
}

function getMostUsedWords(results, topCount) {
    const wordCount = {};

    for (const result of results) {
        const messages = result.messages || [];

        for (const message of messages) {
            if (message.content && !message.call_duration) {
                const words = message.content.split(/\s+/);

                for (const word of words) {
                    const cleanedWord = replacePolishCharacters(word).toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '');
                    if (!wordCount[cleanedWord]) {
                        wordCount[cleanedWord] = 0;
                    }
                    wordCount[cleanedWord] += 1;
                }
            }
        }
    }

    const sortedWords = Object.entries(wordCount)
        .sort(([, countA], [, countB]) => countB - countA)
        .slice(0, topCount)
        .reduce((acc, [word, count]) => {
            acc[word] = { count };
            return acc;
        }, {});

    return sortedWords;
}

function getMostActiveDay(results) {
    const dayCount = {};

    for (const result of results) {
        const messages = result.messages || [];

        for (const message of messages) {
            if (message.timestamp_ms) {
                const timestamp = new Date(parseInt(message.timestamp_ms, 10));
                const day = timestamp.toDateString();

                dayCount[day] = (dayCount[day] || 0) + 1;
            }
        }
    }

    const sortedDays = Object.entries(dayCount)
        .sort((a, b) => b[1] - a[1])
        .map(entry => ({ day: entry[0], count: entry[1] }));

    return sortedDays[0];
}

// function getWordCount(results) {
//     const userWordCount = {};

//     for (const result of results) {
//         const messages = result.messages || [];

//         for (const message of messages) {
//             if (message.content) {
//                 const userName = message.sender_name;
//                 const words = message.content.split(/\s+/);
//                 if (!userWordCount[userName]) {
//                     userWordCount[userName] = { name: userName, count: 0 }
//                 }

//                 userWordCount[userName].count += words.length;
//             }
//         }
//     }

//     return userWordCount;
// }


