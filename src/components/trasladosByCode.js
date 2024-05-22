import { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, ToastAndroid, View } from "react-native";
import KeyEvent from 'react-native-keyevent';
import fetchIvan from "./_fetch";
import RNBeep from 'react-native-a-beep';
import Entypo from "react-native-vector-icons/Entypo";
import AntDesign from "react-native-vector-icons/AntDesign";
const Global = require('../../app.json');

const { Provider, Stack, Text, TextInput, HStack, Switch, ListItem, ActivityIndicator, IconButton } = require("@react-native-material/core")

const trasladosStatus = ['Eliminado', 'En progreso', 'En Tránsito, en espera de SAP', 'En Tránsito, cargado en SAP', 'Recibido, en espera de SAP', 'Completado', 'Devuelto en espera de SAP', 'Devuelto'];
const trasStatusColor = ['red', 'yellow', 'blue', 'orange', 'lightgreen', 'green', 'lightred', 'red'];

const TrasladosByCode = (props) => {
    const [loading, setLoading] = useState(false);
    const [traslado, setTraslado] = useState({});
    const [showKeyBoard, setShowKeyBoard] = useState(false);
    const [msgConexion, setMsgConex] = useState('');
    const [paleta, setPaleta] = useState(null);

    const inputScan = useRef(null);

    const evento = (keyEvent) => { 
        if(!inputScan.current?.isFocused()) {
            if((keyEvent.keyCode >= 520 && keyEvent.keyCode <= 523) || keyEvent.keyCode === 103 || keyEvent.keyCode === 10036) { // Nos llaman con enter
                console.log("Activamos ")
                inputScan.current?.focus();
            }

            if(keyEvent.keyCode >= 29 && keyEvent.keyCode <= 54) { // A-Z
                if(inputScan.current) {
                    inputScan.current.focus();
                    inputScan.current.setNativeProps({ text: keyEvent.pressedKey })
                }
            } else if(keyEvent.keyCode >= 7 && keyEvent.keyCode <= 16) { // 0-9
                if(inputScan.current) {
                    inputScan.current.focus();
                    inputScan.current.setNativeProps({ text: keyEvent.pressedKey })
                }
            }
        }
    }

    useEffect(() => { // Efecto de montura del componente
        if(props.tabActive) {
            console.log("Hola soy by code")
            KeyEvent.onKeyDownListener(evento);

            return () => {
                //console.log("Remove keyboard listener");
                KeyEvent.removeKeyDownListener();
            }
        } 
    }, [props.tabActive]);

    useEffect(() => { // efecto para cada vez que cambian los estados de las config nos pone modo FOCUS
        if(props.tabActive) {
            setTimeout(() => {
                inputScan.current?.focus()
            }, 100);
        }
    },[showKeyBoard, props.tabActive]);

    const codeFind = (text) => {
        if(text.length) {
            //console.log("Hola soy code change "+text);
            let split = text.split(';');
            let codigo = split[0].split(',')[0].match(/([A-Z|a-z|0-9])/g);
            console.log(split);
            if(split.length === 2) {
                findCode(codigo?.join("") || "", split[1].split(',')[0]);
            } else {
                findCode(codigo?.join("") || "");
            }
        }
    }

    const findCode = (scancode, paleta = null) => {
        if(!scancode) return;
        console.log("Codigo scaneado: "+scancode, paleta);

        inputScan.current?.clear();

        setLoading(true);
        setTraslado({});
        setMsgConex('');
        let datos = [
            `code=${scancode}`,
            `type=${props.type}`
        ];

        fetchIvan(props.ipSelect).get('/trasladosByCode', datos.join('&'), props.token.token)
        .then(({data}) => {
            console.log(data);
            setTraslado({...data.data, IDPAL: paleta});
        })
        .catch(({status, error}) => {
            console.log(error);
            RNBeep.beep(false);
            if(error && typeof(error) !== 'object' && error.indexOf("request failed") !== -1) {
                setMsgConex("¡Ups! Parece que no hay conexión a internet");
            }
            return ToastAndroid.show(
                error?.text || error?.message || (error && typeof(error) !== 'object' && error.indexOf("request failed") !== -1 ? "Por favor chequea la conexión a internet":"Error interno, contacte a administrador"),
                ToastAndroid.SHORT
            );
        })
        .finally(() => {
            setLoading(false);
            inputScan.current?.focus();
        });
    }

    const updateTras = useCallback((udp) => setTraslado(udp));

    return (
        <Provider>
            <Stack spacing={10} m={4} style={{flex: 1}}> 
                {!loading && msgConexion ? <Text style={{padding: 3, backgroundColor: 'red', color: 'white', textAlign: 'center', fontSize: 12}}>{msgConexion}</Text>:''}
                
                <Text style={[styles.title1, {marginTop: 0}]}>{Global.displayName}</Text>
                
                <TextInput placeholder="Pulsa y escanea o escribe manualmente" 
                    autoFocus = {true} 
                    onEndEditing={(e) => codeFind(e.nativeEvent.text) }
                    showSoftInputOnFocus={showKeyBoard}
                    //keyboardType={!showKeyBoard ? "numeric":"default"}
                    ref={inputScan}
                    maxLength={20}
                />

                <HStack style={{alignItems:'center', alignSelf: 'center'}}>
                    <Text style={styles.small2}>Activar teclado</Text>
                    <Switch value={showKeyBoard} onValueChange={() => setShowKeyBoard(!showKeyBoard)} autoFocus={false}/> 
                </HStack>

                {loading && <ActivityIndicator />}
                {traslado.IDTRA && 
                <ListItem
                    title={traslado.TRCON}
                    overline={trasladosStatus[traslado.TRSTS]}
                    secondaryText={"Origen: "+traslado.DesdeCentro?.NAME1+" ("+traslado.DesdeCentro?.Almacenes[0]?.LGOBE+")\n"+"Destino: "+traslado.HaciaCentro?.NAME1+" ("+traslado.HaciaCentro?.Almacenes[0]?.LGOBE+")\n"+traslado.DATEU?.substr(0,16).replace("T"," ")+
                        "\nPedido Nº: "+(traslado.IDPED ?? "Traslado MANUAL")}
                    leading={<Entypo name="circle" size={24} backgroundColor={trasStatusColor[traslado.TRSTS]} color={trasStatusColor[traslado.TRSTS]} style={{borderRadius: 12}} />}
                    //trailing={p2 => props.dataUser.USSCO.indexOf('TRASLADOS_DEL') !== -1 && (traslado.TRSTS < 3) && <IconButton icon={p2=p2 => <AntDesign name="delete" {...p2}/> } onPress={() => dropTraslado(traslado.TRCON, traslado.IDTRA)}/>}
                    onPress={() => props.dataUser.CAMIONERO || props.dataUser.USSCO.indexOf('SCAN') !== -1 || props.dataUser.USSCO.indexOf('RECEIVE_TRAS') !== -1 ? props.navigation.navigate('VerItems', {
                        traslado: traslado,
                        updateTras: updateTras,
                        IDPAL: traslado.IDPAL
                    }):''}
                />
                }
                <View style={{width: 100, height: 150}}/>
            </Stack>
        </Provider>
    )
}


export default TrasladosByCode;


const styles = StyleSheet.create({
    title1: {
        alignSelf: 'center',
        fontSize: 16,
        fontWeight: 'bold'
    },
    small2: {
        fontSize: 11,
    },
});