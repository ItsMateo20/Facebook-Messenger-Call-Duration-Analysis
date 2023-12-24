import json
from datetime import timedelta
import os
from tkinter import Tk, filedialog

def format_duration(seconds):
    duration = timedelta(seconds=seconds)
    days = duration.days
    hours, remainder = divmod(duration.seconds, 3600)
    minutes, seconds = divmod(remainder, 60)
    return f"{days} days, {hours} hours, {minutes} minutes, {seconds} seconds"

def get_folder_path():
    root = Tk()
    root.withdraw()

    folder_path = filedialog.askdirectory(title="Select Folder")
    root.destroy()

    return folder_path

def analyze_messenger_data(folder_path):
    total_call_duration = 0

    for file_name in os.listdir(folder_path):
        if file_name.startswith("message_") and file_name.endswith(".json"):
            file_path = os.path.join(folder_path, file_name)
            with open(file_path, 'r', encoding='utf-8') as file:
                data = json.load(file)

                messages = data.get('messages', [])
                for message in messages:
                    if 'call_duration' in message:
                        duration_seconds = message['call_duration']
                        total_call_duration += duration_seconds

    formatted_duration = format_duration(total_call_duration)
    print(f"Total call duration: {formatted_duration}")

json_folder_path = get_folder_path()

if json_folder_path:
    analyze_messenger_data(json_folder_path)
else:
    print("No folder selected. Please run the script again and choose a valid folder.")
