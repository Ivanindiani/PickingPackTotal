import { Linking } from 'react-native';
import BackgroundService from 'react-native-background-actions';
import GetLocation from 'react-native-get-location'


const sleep = (time) => new Promise((resolve) => setTimeout(() => resolve(), time));

// You can do anything in your task such as network requests, timers and so on,
// as long as it doesn't touch UI. Once your task completes (i.e. the promise is resolved),
// React Native will go into "paused" mode (unless there are other tasks running,
// or there is a foreground app).
const veryIntensiveTask = async (taskDataArguments) => {
    // Example of an infinite loop task
    const { delay, orderId } = taskDataArguments;
    console.log("Llamamos al ejecturor")
    await new Promise( async (resolve) => {
        for (let i = 0; BackgroundService.isRunning(); i++) {
            console.log("Update GPS", orderId);
            GetLocation.getCurrentPosition({
                enableHighAccuracy: false,
                timeout: 60000,
            })
            .then(location => {
                console.log(location);
            })
            .catch(error => {
                const { code, message } = error;
                console.warn(code, message);
            })
            await sleep(delay);
        }
    });
};

const options = {
    taskName: 'Route',
    taskTitle: 'TotalWMS en ruta',
    taskDesc: 'Estás en modo ruta, recuerda reportar en la aplicación a donde te diriges y reportar cuando finalice las entregas',
    taskIcon: {
        name: 'ic_launcher',
        type: 'mipmap',
    },
    color: '#ff00ff',
    linkingURI: 'exampleScheme://chat/jane', // See Deep Linking for more info
    parameters: {
        delay: 1000*30,
        orderId: 0
    },
};

const backGround = {
    start: async (orderId) => {
        options.parameters.orderId = orderId;
        console.log("Iniciando servicio: ", options)
        return await BackgroundService.start(veryIntensiveTask, options);
    },
    update: (desc) => BackgroundService.updateNotification({taskDesc: desc}),
    stop: () => BackgroundService.stop(),
    isRunning: () => BackgroundService.isRunning()
}

function handleOpenURL(evt) {
    console.log(evt.url);
    // do something with the url
}

Linking.addEventListener('url', handleOpenURL);
  
export default backGround;

//await BackgroundService.start(veryIntensiveTask, options);
//await BackgroundService.updateNotification({taskDesc: 'New ExampleTask description'}); // Only Android, iOS will ignore this call
// iOS will also run everything here in the background until .stop() is called
//await BackgroundService.stop();