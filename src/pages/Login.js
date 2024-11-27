import { Button, HStack, IconButton, Stack, Text, TextInput } from "@react-native-material/core";
import { useRef, useState } from "react";
import { Alert, StyleSheet, ToastAndroid } from "react-native";
import AntDesign from 'react-native-vector-icons/AntDesign';
import Entypo from 'react-native-vector-icons/Entypo';
import Mi from 'react-native-vector-icons/MaterialCommunityIcons';
import fetchIvan from "../components/_fetch";
import SelectInput from "../components/_virtualSelect";
const Global = require('../../app.json');
import AsyncStorage from '@react-native-async-storage/async-storage';


const tipoCedulas = [{
    label: 'V',
    value: 'V'
},{
    label: 'E',
    value: 'E'
},{
    label: 'J',
    value: 'J'
}];

const Login = (props) => {
    const [visiblePass, setVisiblePass] = useState(true);
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState({
        username: '',
        password: '',
        tipoCedula: 'V'
    });
    const [camionero, setCamionero] = useState(false);

    const user = useRef(null);
    const password = useRef(null);

    const storeData = async (value) => {
        try {
          const jsonValue = JSON.stringify(value);
          await AsyncStorage.setItem(Global.keyCamionero, jsonValue);
        } catch (e) {
          // saving error
        }
    };

    const getData = async () => {
        try {
          const jsonValue = await AsyncStorage.getItem(Global.keyCamionero);
          return jsonValue != null ? JSON.parse(jsonValue) : null;
        } catch (e) {
          // error reading value
        }
    };

    const onLogin = () => {
        if(!camionero && (!data.username || !data.password)) {
            return ToastAndroid.show(
                "Debes ingresar usuario y contraseña",
                ToastAndroid.LONG
            );
        }
        if(camionero && !data.username) {
            return ToastAndroid.show(
                "Debes ingresar tu cédula",
                ToastAndroid.LONG
            );
        }
        const datos = {
            username: camionero ? (data.tipoCedula+data.username):data.username,
            password: data.password,
            camionero: camionero ? true:undefined,
            deviceId: props.deviceInfo.id,
            versionApp: props.deviceInfo.version,
            systemVersion: props.deviceInfo.systemVersion,
            mac: props.deviceInfo.mac,
            ip: props.deviceInfo.ip,
            hardware: props.deviceInfo.hardware,
            model: props.deviceInfo.model
        }

        setLoading(true);
        fetchIvan(props.ipSelect).post('/auth', datos, undefined, undefined, undefined, 10000)
        .then(async (datica) => {
            //console.log("login", datica.data, datica.token, props.token, props.dataUser);
            props.setDataUser(datica.data.data);
            props.setDataToken(datica.data.token);
            setData({
                username: '',
                password: '',
                tipoCedula: data.tipoCedula
            });
            if(camionero) {
                let dataCamionero = await getData();
                console.log("Data", dataCamionero);
                if(!dataCamionero || dataCamionero.username !== data.tipoCedula+data.username) {
                    storeData({
                        username: data.tipoCedula+data.username,
                        deviceId: props.deviceInfo.id
                    })
                }
            }
            ToastAndroid.show("Inicio de sesión correcto", ToastAndroid.LONG)
            props.navigation.navigate('Home');
        })
        .catch(({status, error}) => {
            console.log("ERROR", error);
            if(error.update_forced) {
                return Alert.alert("Hay una nueva versión disponible", "Por favor ingresa a playstore y actualiza la aplicación a la nueva versión");
            }
            return ToastAndroid.show(
                error?.text || error?.message || (error && typeof(error) !== 'object' && error.indexOf("request failed") !== -1 ? "Por favor chequea la conexión a internet":"Error interno, contacte a administrador"),
                6000
            );
        })
        .finally(() => {
            setLoading(false);
        });
    }
    return (
        <Stack spacing={2} style={{ margin: 12, height: '100%' }}>
            <Text style={styles.title1}>Autenticación</Text>
            {camionero ?
            <Stack style={styles.form}>
                <HStack spacing={2}>
                    <SelectInput
                        searchable={false}
                        data={tipoCedulas}
                        value={data.tipoCedula}
                        setValue={(value) => setData({...data, tipoCedula: value})}
                        title={data.tipoCedula}
                        buttonStyle={{with: '18%', height: 35, alignSelf: 'flex-end', marginBottom: 5}}
                    />
                    <TextInput
                        autoCapitalize="none"
                        ref={user}
                        placeholder="Nº de Cédula"
                        value={data.username}
                        keyboardType="numeric"
                        onChangeText={(text) => setData({...data, username: text.replace(/[^0-9]/g, '')})}
                        leading={props2 => <Mi name="card-account-details" {...props2} />}
                        maxLength={10}
                        style={{width: '80%', marginLeft: 10}}
                    />
                </HStack>
                <Stack center style={{marginTop: 20}}>
                    <Button loading={loading}
                        title="Iniciar Sesión" 
                        color={Global.colorMundoTotal} 
                        trailing={props2 => <Mi name="send" {...props2} />}
                        loadingIndicatorPosition="trailing"
                        disabled={loading || (!data.username)}
                        onPress={onLogin}/>
                </Stack>
            </Stack>:
            <Stack style={styles.form}>
                <TextInput
                    autoCapitalize="none"
                    ref={user}
                    placeholder="Usuario"
                    value={data.username}
                    onChangeText={(text) => setData({...data, username: text.trim().toLowerCase()})}
                    leading={props2 => <Mi name="account" {...props2} />}
                />
                <TextInput
                    ref={password}
                    secureTextEntry={visiblePass}
                    placeholder="Clave"
                    value={data.password}
                    onChangeText={(text) => setData({...data, password: text})}
                    autoCapitalize='none'
                    trailing={props2 => (
                        <IconButton icon={props3 => !visiblePass ? <AntDesign name="eye" {...props3} />:<Entypo name="eye-with-line" {...props3} />} {...props2} onPressIn={()=>setVisiblePass(!visiblePass)}/>
                    )}
                />
                <Stack center style={{marginTop: 20}}>
                    <Button loading={loading}
                        title="Iniciar Sesión" 
                        color={Global.colorMundoTotal} 
                        trailing={props2 => <Mi name="send" {...props2} />}
                        loadingIndicatorPosition="trailing"
                        disabled={loading || (!data.username || !data.password)}
                        onPress={onLogin}/>
                </Stack>
            </Stack>}
            <Button loading={loading}
                title={camionero ? "¿Eres de almacén o tienda?":'¿Eres Conductor?'}
                color={Global.colorMundoTotal} 
                disabled={loading}
                uppercase={false}
                variant="text"
                onPress={() => {setCamionero(!camionero); setData({username: '', password: '', tipoCedula: data.tipoCedula})}}
                style={{marginTop: 10, padding: 10, alignSelf: 'center'}}/>
                <Text style={styles.footer}><AntDesign name="infocirlce" color={Global.colorMundoTotal} size={18} onPress={() =>{
                    return Alert.alert("TotalWMS", "Versión de la aplicación: V"+props.deviceInfo.version+"\n\nDevelop and report error: \nIvan Gulfo\nivansicol@gmail.com")
                }}/> V{props.deviceInfo.version} | {props.deviceInfo.id}</Text>
        </Stack>
    )
}

export default Login;

const styles = StyleSheet.create({
    title1: {
        alignSelf: 'center',
        fontSize: 16,
        fontWeight: 'bold'
    },
    form: {
        marginTop: 10
    },
    footer: {
        position: 'absolute',
        left: 0,
        bottom: 20,
        fontSize: 12,
        zIndex: -1
    }
})