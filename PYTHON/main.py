import datetime
import os
from sre_parse import Tokenizer
import sys
import time
import webbrowser
import pyautogui
import pyttsx3
import speech_recognition as sr
import psutil

import json
import pickle
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.sequence import pad_sequences
import random
import numpy as np
# from elevenlabs import generate, play
# from elevenlabs import set_api_key
# from api_key import api_key_data
# set_api_key(api_key_data)

# def engine_talk(query):
#     audio= generate(
#         text=query,
#         voice= 'Grace',
#         model= "eleven_monolingual_v1"
#     )
#     play(audio)


with open("intents.json") as file:
    data= json.load(file)

model= load_model("chat_model.h5")
with open("tokenizer.pkl", "rb") as f:
    tokenizer=pickle.load(f)

with open("label_encoder.pkl", "rb") as encoder_file:
    label_encoder=pickle.load(encoder_file)

def  initialize_engine():
    engine= pyttsx3.init("sapi5")
    voices= engine.getProperty('voices')
    engine.setProperty('voice', voices[1].id)
    rate= engine.getProperty('rate')
    engine.setProperty('rate', rate-50)
    volume=engine.getProperty('volume')
    engine.setProperty('volume', volume+0.25)
    return engine

def speak(text):
    engine= initialize_engine()
    engine.say(text)
    engine.runAndWait()

def command():
    r= sr.Recognizer()
    with sr.Microphone() as source:
        r.adjust_for_ambient_noise(source, duration=0.5)
        print("Listening.......", end="", flush=True)
        r.pause_threshold=1.0
        r.phrase_threshold=0.3
        r.sample_rate=48000
        r.dynamic_energy_threshold=True
        r.operation_timeout=5
        r.non_speaking_duration=0.5
        r.dynamic_energy_adjustment=2
        r.energy_threshold=4000
        r.phrase_time_limit=10
        # print(sr.Microphonoe.list_microphone_names())
        audio=r.listen(source)
    try:
        print("\r" ,end="", flush=True)
        print("Recognizing.....")
        query= r.recognize_google(audio, language='en_in')
        print("\r" ,end="", flush=True)
        print(f"user said : {query}\n")
    except Exception as e:
        print("Say that againn Please")
        return "None"
    return query

def cal_day():
    day= datetime.datetime.today().weekday() + 1
    day_dict= {
        1: "monday",
        2: "tuesday",
        3: "wednesday",
        4: "thursday",
        5: "friday",
        6: "saturday",
        7: "sunday"
    }
    if day in day_dict.keys():
        day_of_week= day_dict[day]
        print(day_of_week)
    return day_of_week

def wishMe():
    hour= int(datetime.datetime.now().hour)
    t= time.strftime("%I: %M: %p")
    day=cal_day()
    
    if(hour>=0) and (hour <=12) and ('AM' in t):
        speak("Good Morning Boss Rendo, it's {day} and the time is{t}")
    elif(hour>=12) and (hour<=16) and('PM' in t):
        speak(f"Good Afternoon Boss Rendo, it's {day} and the time is{t}")
    else: 
        speak(f"Good Evening Boss Rendo, it's {day} and the time is{t}")

def social_media(command):
    if 'facebook' in command:
        speak("Opening your facebook")
        webbrowser.open("https://www.facebook.com/")
    elif 'youtube' in command:
        speak("Opening your youtube")
        webbrowser.open("https://www.youtube.com/")
    elif 'discord' in command:
        speak("Open your discord server")
        webbrowser.open("https://www.discord.com/")
    elif 'chatgpt' in command:
        speak("Open your Chat G P T")
        webbrowser.open("https://www.chatgpt.com/")
    else:
        speak("No result is found here")

def schedule():
    day= cal_day().lower()
    speak("Bosss today's schedule is ")
    week={
        "monday": "Boss, from 8:30 am to 11:30 am you have algorithm class, andn after that you got to lunch to eat sir",
        "thursday": "Today you freely boss",
    }
    if day in week.keys():
        speak(week[day])

def openApp(command):
    if "god" in command:
        speak("Opening God of war four ragnarok")
        os.startfile('D:\Steam\Steamapps\common\God of War Ragnarok\GoWR.exe')
    elif "notepad" in command:
        speak("Opening notepad")
        os.startfile('C:\\Windows\\System32\\notepad.exe')
    elif "ark survival" in command:
        speak("Opening ark survival pro max ")
        os.startfile('D:\Steam\Steamapps\common\ARK\ShooterGame\Binaries\Win64\ShooterGame.exe')

def closeApp(command):
    if "god" in command:
        speak("Closing god of war ragnarok")
        os.system('taskkill /f /im GoWR.exe')
    elif "notepad" in command:
        speak("Closing notepad")
        os.system('taskkill /f /im notepad.exe')
    elif "ark survival" in command:
        speak("Closing ark survival")
        os.system('taskkill /f /im ShooterGame.exe')  

def browsing(commmand):
    if 'google' in query:
        speak("Sir, what should i search on google for you ...")
        s= command().lower()
        webbrowser.open(f"{s}")
    # elif 'edge' in query:
    #     speak("Opening your microsft edge")
    #     os.startfile()

def condition():
    usage =str(psutil.cpu_percent())
    speak(f"Your laptop CPU is {usage} percentage")
    battery= psutil.sensors_battery()
    percentage= battery.percent
    speak(f"and {percentage} percentage battery")
    if percentage>= 80:
        speak("Boss we could have enough charging to continue learn programming")
    elif percentage>= 40 and  percentage<=75:
        speak("Boss we should connect our system to charging pooint to charge out battery")
    else :
        speak("Boss we have verey low power, please connect to charging other wise application should be turn off")
if __name__== "__main__":
    # wishMe()
    # engine_talk("Allow me to intruduce myself I am Jarvis, the virtual artificial intelligence and i'm here to assist only you boss rendo freely 24 hours at anytime")
    while True:
        query= command().lower()
        # query= input("Enter your command-> ")
        if ('facebook' in query) or ('discord' in query) or('youtube' in query) or ('instagram' in query) or ('chatgpt' in query):
            social_media(query)
        elif("university time table" in query) or ("schedule" in query):
            schedule()
        elif("volume up" in query) or ("increase volume"in query):
            pyautogui.press("volumeup")
            speak("Your laptop Volume increased")
        elif("volume down" in query) or ("decrease volume"in query):
            pyautogui.press("volumedown")
            speak("Your laptop Volume decreased")
        elif("volume mute" in query) or ("mute the sound"in query):
            pyautogui.press("volumemute")
            speak("Your laptop Volume mute")
        elif("open god" in query) or ("open notepad" in query) or ("open ark survival" in query):
            openApp(query)
        elif("close god" in query) or ("close notepad" in query) or ("close ark survival" in query):
            closeApp(query)
        elif ("what" in query) or ("who" in query) or ("how" in query) or ("hi" in query) or ("thanks" in query) or ("hello" in query):
                padded_sequences= pad_sequences(tokenizer.texts_to_sequences([query]), maxlen=20, truncating='post')
                result= model.predict(padded_sequences)
                tag= label_encoder.inverse_transform([np.argmax(result)])

                for i in data['intents']:
                    if i['tag'] == tag:
                        speak(np.random.choice(i['responses']))
        elif("open google" in query) or ("open edge" in query):
            browsing(query)
        
        elif ("system condition"in query) or ("condition of the system" in query):
            speak("checking the system condition")
            condition()
        elif "exit" in query:
            sys.exit()
# speak("Hello, I'm Rendo")

        
    
