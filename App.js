import React, { useEffect, useState } from 'react';
import {StyleSheet, View} from 'react-native';
import Routes from './src/Router';
import DeviceInfo from 'react-native-device-info';
import AsyncStorage from '@react-native-async-storage/async-storage';

//import LogRocket from '@logrocket/react-native';
//LogRocket.init('mucn3o/pistoleoapp')

//DT40 2bffc63708fd5364
//emulator 98ba9dece80cfa7b
// TC21 7e90509a8dce6315
// SQ45S b613a5c50419a713
// Infinix 3c57580a39f97a9d
const App = () => {
    const [dataUser, setDataUser] = useState({});
    const [token, setDataToken] = useState({});
    const [ipSelect, setIp] = useState(null);
    const [deviceInfo, setDeviceId] = useState({});

    useEffect(() => {
        const init = async () => {
            setDeviceId({
                id: await DeviceInfo.getUniqueId(),
                version: DeviceInfo.getVersion(),
                systemVersion: DeviceInfo.getSystemName()+" "+DeviceInfo.getSystemVersion(),
                mac: await DeviceInfo.getMacAddress(),
                ip: await DeviceInfo.getIpAddress(),
                hardware: await DeviceInfo.getHardware(),
                model: DeviceInfo.getModel()
            });
            /*console.log(DeviceInfo.getSystemName(), DeviceInfo.getSystemVersion());
            console.log(
                DeviceInfo.getModel(), 
                await DeviceInfo.getMacAddress(),
                await DeviceInfo.getIpAddress(),
                await DeviceInfo.getHardware()
            );*/
        }

      init();
    }, []);

    const storeData = async (value) => {
        try {
          return await AsyncStorage.setItem('pistoleoapp_ipselect', value);
        } catch (e) {
          // saving error
          return null;
        }
    };

    useEffect(() => {
        console.log("Hola IP ", ipSelect)
        if(!ipSelect) {
            const getData = async () => {
                try {
                  const value = await AsyncStorage.getItem('pistoleoapp_ipselect');
                  if(value !== null) {
                    console.log("Guardando IP: ",value);
                    setIp(value);
                  } 
                } catch (e) {
                    console.log("Error opteniendo data ip ", e)
                }
            };
            getData();
        } else {
            storeData(ipSelect);
        }
    }, [ipSelect]);

    return (
        <View style={styles.container}>
            <Routes dataUser={dataUser} setDataUser={setDataUser} token={token} setDataToken={setDataToken} ipSelect={ipSelect} setIp={setIp} deviceInfo={deviceInfo}/>
        </View>
    );
};

export default App;

const styles = StyleSheet.create({
    container : {
        flex: 1,
    }
});
