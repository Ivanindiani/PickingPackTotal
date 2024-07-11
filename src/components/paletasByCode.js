import { useCallback, useEffect, useRef, useState } from "react";
import { FlatList, ScrollView, StyleSheet, ToastAndroid, View } from "react-native";
import KeyEvent from 'react-native-keyevent';
import fetchIvan from "./_fetch";
import RNBeep from 'react-native-a-beep';
import Entypo from "react-native-vector-icons/Entypo";
import AntDesign from "react-native-vector-icons/AntDesign";
const Global = require('../../app.json');

const { Provider, Stack, Text, TextInput, HStack, Switch, ListItem, ActivityIndicator, IconButton } = require("@react-native-material/core")
const trasladosStatus = ['Eliminado', 'En progreso', 'En Tránsito, en espera de SAP', 'En Tránsito, cargado en SAP', 'Recibido, en espera de TotalPost', 'Completado', 'Devuelto en espera de SAP', 'Devuelto'];
const trasStatusColor = ['red', 'yellow', 'blue', 'orange', 'lightgreen', 'green', 'lightred', 'red'];

const PaletasByCode = (props) => {
    const [loading, setLoading] = useState(false);
    const [traslados, setTraslados] = useState([]);
    const [showKeyBoard, setShowKeyBoard] = useState(false);
    const [msgConexion, setMsgConex] = useState('');
    const [pallet, setPallet] = useState(null);

    const inputPaleta = useRef(null);

    const evento = (keyEvent) => { 
        if(!inputPaleta.current?.isFocused()) {
            if((keyEvent.keyCode >= 520 && keyEvent.keyCode <= 523) || keyEvent.keyCode === 103 || keyEvent.keyCode === 10036) { // Nos llaman con enter
                console.log("Activamos ")
                inputPaleta.current?.focus();
            }

            if(keyEvent.keyCode >= 29 && keyEvent.keyCode <= 54) { // A-Z
                if(inputPaleta.current) {
                    inputPaleta.current.focus();
                    inputPaleta.current.setNativeProps({ text: keyEvent.pressedKey })
                }
            } else if(keyEvent.keyCode >= 7 && keyEvent.keyCode <= 16) { // 0-9
                if(inputPaleta.current) {
                    inputPaleta.current.focus();
                    inputPaleta.current.setNativeProps({ text: keyEvent.pressedKey })
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
                inputPaleta.current?.focus()
            }, 100);
        }
    },[showKeyBoard, props.tabActive]);

    const codeFind = (text) => {
        if(text.length) {
            //console.log("Hola soy code change "+text);
            let codigo = text.split(',')[0].match(/([0-9])/g);
            findCode(codigo?.join("") || "");
        }
    }

    const findCode = (scancode) => {
        if(!scancode) return;
        console.log("Codigo scaneado: "+scancode);

        inputPaleta.current?.clear();

        setLoading(true);
        setTraslados([]);
        setMsgConex('');
        setPallet(null);
        let datos = [
            `code=${scancode}`,
            `type=${props.type}`
        ];

        fetchIvan(props.ipSelect).get('/trasladosByPallet', datos.join('&'), props.token.token)
        .then(({data}) => {
            console.log(data);
            setPallet(parseInt(scancode));
            setTraslados(data.data);
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
            inputPaleta.current?.focus();
        });
    }

    const updateTras = useCallback((udp) => {
        let temp = JSON.parse(JSON.stringify(traslados));
        
        for(let pet in temp) {
            if(temp[pet].IDTRA === udp.IDTRA) {
                temp[pet] = udp;
                break;
            }
        }
        setTraslados(temp);
    }, [traslados]);

    return (
        <Provider>
            <Stack spacing={10} m={4} style={{flex: 1}}> 
                {!loading && msgConexion ? <Text style={{padding: 3, backgroundColor: 'red', color: 'white', textAlign: 'center', fontSize: 12}}>{msgConexion}</Text>:''}
                
                <Text style={[styles.title1, {marginTop: 0}]}>{Global.displayName}</Text>
                
                <TextInput placeholder="Pulsa y escanea o escribe manualmente" 
                    autoFocus = {true} 
                    onEndEditing={(e) => codeFind(e.nativeEvent.text) }
                    showSoftInputOnFocus={showKeyBoard}
                    keyboardType={"numeric"}
                    ref={inputPaleta}
                    maxLength={10}
                />

                <HStack style={{alignItems:'center', alignSelf: 'center'}}>
                    <Text style={styles.small2}>Activar teclado</Text>
                    <Switch value={showKeyBoard} onValueChange={() => setShowKeyBoard(!showKeyBoard)} autoFocus={false}/> 
                </HStack>

                {loading && <ActivityIndicator />}

                <FlatList
                    data={traslados}
                    renderItem={({item, index}) => 
                        <ListItem
                            key={index}
                            title={item.TRCON}
                            overline={trasladosStatus[item.TRSTS]}
                            secondaryText={"Origen: "+item.DesdeCentro?.NAME1+" ("+item.DesdeCentro?.Almacenes[0]?.LGOBE+")\n"
                                +"Destino: "+item.HaciaCentro?.NAME1+" ("+item.HaciaCentro?.Almacenes[0]?.LGOBE+")\n"
                                +item.DATEU?.substr(0,16)?.replace("T"," ")
                                +"\nPedido Nº: "+(item.IDPED ?? "Traslado MANUAL")
                                +(item.TRSTS > 2 ? "\nNº Documento SAP: "+item.CodigosTraslado?.MBLNR:'')
                                +`\nPeso: ${parseFloat(item.PESO??0).toFixed(2)} KG`
                                +`\nVolumen: ${parseFloat(item.VOLUMEN??0).toFixed(2)} M3`}
                            leading={<Entypo name="circle" size={24} backgroundColor={trasStatusColor[item.TRSTS]} color={trasStatusColor[item.TRSTS]} style={{borderRadius: 12}} />}
                            //trailing={p2 => props.dataUser.USSCO.indexOf('TRASLADOS_DEL') !== -1 && (item.TRSTS < 3) && <IconButton icon={p2=p2 => <AntDesign name="delete" {...p2}/> } onPress={() => dropTraslado(item.TRCON, item.IDTRA)}/>}
                            onPress={() => props.dataUser.CAMIONERO || props.dataUser.USSCO.indexOf('SCAN') !== -1 || props.dataUser.USSCO.indexOf('RECEIVE_TRAS') !== -1 ? 
                                props.navigation.navigate('VerItems', {
                                    traslado: item,
                                    updateTras: updateTras,
                                    fixpallet: pallet
                                }):''
                            }
                        />
                    }
                />
            </Stack>
        </Provider>
    )
}


export default PaletasByCode;


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