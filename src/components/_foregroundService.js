import ReactNativeForegroundService from '@supersami/rn-foreground-service';
ReactNativeForegroundService.register();
import GetLocation from 'react-native-get-location';

//request the permission before starting the service.

const foreground = {
    add_task: () => ReactNativeForegroundService.add_task(
        async () => {
            // if has permissions try to obtain location with RN location
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
            });
        },
        {
            delay: 1000*10,
            onLoop: true,
            taskId: 'location_conductor',
            onError: (e) => console.log('Error logging:', e),
        },
    ),
    all: ReactNativeForegroundService
};

export default foreground;