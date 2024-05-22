import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, RefreshControl, ScrollView, StyleSheet, ToastAndroid, TouchableHighlight, View } from "react-native";
import { ActivityIndicator, Box, Button, HStack, Stack, Switch, Text, TextInput, VStack, Dialog, DialogActions, DialogContent, DialogHeader, Provider } from "@react-native-material/core"
import fetchIvan from "../components/_fetch";
import RNBeep from "react-native-a-beep";
import ImagesAsync from "../components/_imagesAsync";
import Entypo from "react-native-vector-icons/Entypo";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import MI from "react-native-vector-icons/MaterialCommunityIcons";
import KeyEvent from 'react-native-keyevent';
const Global = require('../../app.json');

import { LogBox } from 'react-native';
import ListaPerform from "../components/_virtualList";
import { Linking } from "react-native";

LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
]);


const VerItems = (props) => {

    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState([]);
    const [dialogItem, setDialogItem] = useState({});
    const [dialogVisible, setDialogVisible] = useState(false);
    const [traslado, setTraslado] = useState(props.route.params.traslado);
    const [showKeyBoard, setShowKeyBoard] = useState(false);
    const inputScan = useRef(null);
    const scrollShow = useRef(null);
    const [scanSelect, setScan] = useState({});
    const [showInfo, setShowInfo] = useState(false);
    const [msgConexion, setMsgConex] = useState('');
    const [onlyPalet, setOnlyPalet] = useState(props.route.params.IDPAL ? true:false);

    const elInput = useRef(null);

    // Evento alternativo para detectar el escaneo
    const evento = (keyEvent) => { 
        if(!inputScan.current?.isFocused()) {
            console.log(`onKeyUp keyCode: ${keyEvent.keyCode}`);
            console.log(`Action: ${keyEvent.action}`);
            console.log(`Key: ${keyEvent.pressedKey}`);
            
            if((keyEvent.keyCode >= 520 && keyEvent.keyCode <= 523) || keyEvent.keyCode === 103 || keyEvent.keyCode === 10036) { // Nos llaman con enter
                console.log("Activamos ")
                inputScan.current?.focus();
                scrollShow.current?.scrollTo({y: 20, animated: true});
            }

            if(keyEvent.keyCode >= 29 && keyEvent.keyCode <= 54) { // A-Z
                inputScan.current?.focus();
                inputScan.current.setNativeProps({ text: keyEvent.pressedKey })
                scrollShow.current?.scrollTo({y: 20, animated: true});
            } else if(keyEvent.keyCode >= 7 && keyEvent.keyCode <= 16) { // A-Z
                inputScan.current?.focus();
                inputScan.current.setNativeProps({ text: keyEvent.pressedKey })
                scrollShow.current?.scrollTo({y: 20, animated: true});
            }
        }
    }

    useEffect(() => {
        let before = props.navigation.addListener('beforeRemove', (e) => {
            console.log("Mount listener info")
            if(showInfo) {
                e.preventDefault();
                setShowInfo(false)
            }
            if(dialogVisible) {
                e.preventDefault();
                setDialogVisible(false)
            }
        })

        return () => {
            console.log("Remove listener info");
            before();
        }
    }, [props.navigation, showInfo, dialogVisible]);

    useEffect(() => {
        getItems();
        if(traslado.TRSTS >= 3 && traslado.TRSTS < 5) {
            console.log("Mount listerner key")
            KeyEvent.onKeyDownListener(evento);

            return () => {
                console.log("Remove keyboard listener");
                KeyEvent.removeKeyDownListener();
            }
        }
    }, []);

    useEffect(() => {
        setTimeout(() => {
            inputScan.current?.focus()
        }, 200);
    },[showKeyBoard]);

    useEffect(() => {
        if(loading) {
            setMsgConex("");
        }
    }, [loading === true]);

    async function getItems() {
        //console.log("TRASLADO", traslado);
        let data = [
            props.route.params.fixpallet ? `find={"IDTRA": ${traslado.IDTRA}, "IDPAL": ${props.route.params.fixpallet}}`:`find={"IDTRA": ${traslado.IDTRA}}`,
            `checkProducts=false`,
            `unidadBase=true`,
            `simpleData=true`,
        ]
        setLoading(true);
        fetchIvan(props.ipSelect).get('/crudTrasladoItems', data.join('&'), props.token.token)
        .then(({data}) => {
            setItems(data.data);
            ToastAndroid.show("Productos actualizados correctamente", ToastAndroid.SHORT)
            console.log("Productos: ", data.data.length);
        })
        .catch(({status, error}) => {
            console.log(error);
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
        });
    }

    const recibirTraslado = () => {
        Alert.alert('Confirmar', `Antes de completar el traslado, verifique que todos los productos llegaron correctamente con la cantidad esperada.`, [
            {
                text: 'Confirmar',
                style: 'destructive',
                onPress: () => {
                    let diferencias = false;
                    for(let its of items) {
                        if(its.CANTR == null) 
                            return Alert.alert("Error", "Debes confirmar la cantidad de todos los productos antes de recibir el traslado");
                        if(its.TCANT != its.CANTR)
                            diferencias = true;
                    }

                    const update = () => {
                        let datos = {
                            id: traslado.IDTRA,
                            update: {
                                TRSTS: 4
                            }
                        }
                        console.log(scanSelect, datos);
                        setLoading(true);
                        fetchIvan(props.ipSelect).put('/crudTraslados', datos, props.token.token, undefined, undefined, 150*1000)
                        .then(({data}) => {
                            console.log(data);
                            setTraslado({...traslado, TRSTS: 5});
                            props.route.params.updateTras({...traslado, TRSTS: 5});
                            ToastAndroid.show(
                                "Traslado recibido con éxito",
                                ToastAndroid.LONG
                            );
                        })
                        .catch(({status, error}) => {
                            console.log(status, error);
                            if(error && typeof(error) !== 'object' && error.indexOf("request failed") !== -1) {
                                setMsgConex("¡Ups! Parece que no hay conexión a internet");
                            }
                            if(status === 406) {
                                setTraslado({...traslado, TRSTS: error.status});
                                props.route.params.updateTras({...traslado, TRSTS: error.status});
                                props.navigation.goBack();
                                
                                return ToastAndroid.show(
                                    error?.text || "Solicitud no aceptada, por el servidor",
                                    ToastAndroid.LONG
                                );
                            }
                            return ToastAndroid.show(
                                error?.text || error?.message || (error && typeof(error) !== 'object' && error.indexOf("request failed") !== -1 ? "Por favor chequea la conexión a internet":"Error interno, contacte a administrador"),
                                ToastAndroid.LONG
                            );
                        })
                        .finally(() => {
                            setLoading(false);
                        });
                    }

                    if(diferencias) {
                        Alert.alert('Confirmar', `Hemos detectado que hay diferencias en los productos reportados con los esperados,\n\nEsto puede traer consecuencias graves, y deberán corregir los errores vía SAP\n\n¿Estás seguro nuevamente que deseas recibir el traslado en tienda?.`, [
                            {
                                text: 'Sí Confirmar',
                                style: 'destructive',
                                onPress: () => {
                                    update();
                                },
                            },
                            {
                                text: 'Cancelar',
                                style: 'cancel',
                            }
                        ]);
                    } else {
                        update();
                    }
                },
            },
            {
            text: 'Cancelar',
            style: 'cancel',
            }
        ]);
    } 

    const codeFind = (text) => {
        if(text.length) {
            //console.log("Hola soy code change "+text);
            let codigo = text.split(',')[0].match(/([A-Z|a-z|0-9])/g);
            findCode(codigo?.join("") || "");
        }
    }

    const findCode = (scancode) => {
        if(!scancode) return;

        scrollShow.current?.scrollTo({y: 20, animated: true});
        // Reseteamos variables para su busqueda y de una vez posicionamos el cursor a que escriba lo mas rapido posible
        inputScan.current?.clear();
        inputScan.current?.focus();

        setScan({});
        setLoading(true);
        let data = [
            `fromWERKS=${traslado.FWERK}`,
            `fromLGORT=${traslado.FLGOR}`,
            `code=${scancode}`,
            `trasladoId=${traslado.IDTRA}`,
            `simpleData=true`
        ];
        fetchIvan(props.ipSelect).get('/Scan2', data.join('&'), props.token.token)
        .then(({data}) => {
            let producto = JSON.parse(JSON.stringify(data.data));
            let scanFinal = {};
            let found = 0;
            const unidadBase = producto.Producto.UnidadBase?.MEINS || "ST";
            for(let item of items) {
                if(producto.Producto.MATNR === item.MATNR) {
                    found++;
                    scanFinal = item;
                    scanFinal.Producto = producto.Producto;
                    break;
                }
            }
            if(!found) return ToastAndroid.show("El producto que escaneó no está en la lista", ToastAndroid.SHORT);

            for(let unidad of producto.Producto.ProductosUnidads) {
                if(unidad.EAN11 === scancode) {
                    scanFinal.unidad_index = unidad;
                    if(unidad.MEINH !== unidadBase) { // ST ES UNIDAD
                        scanFinal.noBase = true;
                    }
                    break;
                }
            }

            //console.log("Find Producto", producto);
            setScan(scanFinal);
        })
        .catch(({status, error}) => {
            RNBeep.beep(false);
            console.log(status, error);
            if(error && typeof(error) !== 'object' && error.indexOf("request failed") !== -1) {
                setMsgConex("¡Ups! Parece que no hay conexión a internet");
            }
            if(status === 406) {
                setTraslado({...traslado, TRSTS: error.status});
                props.route.params.updateTras({...traslado, TRSTS: error.status});
                props.navigation.goBack();
                
                return ToastAndroid.show(
                    error?.text || "Solicitud no aceptada, por el servidor",
                    ToastAndroid.LONG
                );
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

    const AccionesEscaneo = () => 
        <VStack spacing={-8}>
            <TextInput placeholder="Pulsa y escanea o escribe manualmente" 
                //value={scancode}
                //autoFocus = {true} 
                //onChangeText={codeFind} 
                onEndEditing={(e) => codeFind(e.nativeEvent.text) }
                //onBlur={findCode}
                showSoftInputOnFocus={showKeyBoard}
                keyboardType={!showKeyBoard ? "numeric":"default"}
                ref={inputScan}
                maxLength={18}
            />

            <HStack style={{alignItems:'center', alignSelf: 'center'}}>
                <Text style={styles.small2}>Activar teclado</Text>
                <Switch value={showKeyBoard} onValueChange={() => setShowKeyBoard(!showKeyBoard)} autoFocus={false}/> 
            </HStack>
        </VStack>
    ;

    const RowProducts = (item, index) => 
        <TouchableHighlight
            activeOpacity={0.6}
            underlayColor="#DDDDDD"
            key={index}
            onPress={() => {
                if(props.dataUser.USSCO.indexOf('TRASLADOS_UPD') !== -1 && traslado.TRSTS === 3) {
                    //console.log(item)
                    setDialogItem({...item, CANTR: item.CANTR || item.TCANT})
                    setDialogVisible(true);
                }
            }}>
            <HStack
                spacing={4}
                style={[styles.items,(scanSelect.Producto?.MATNR === item.MATNR ? {backgroundColor: 'lightgreen'}:{}), {width: '100%', minHeight: 110}]}
            >
                <VStack w={traslado.TRSTS >= 3 ? "50%":"65%"}>
                    <Text style={styles.title2}>{item.MAKTG || ""}</Text>
                    <Text style={[styles.subtitle, {backgroundColor: 'yellow'}]}>{item.MATNR}</Text>
                    <Text style={styles.subtitle} numberOfLines={1}>Paleta: {item.IDPAL.substr(-3).padStart(3, '0')}</Text>
                    {props.dataUser.USSCO.indexOf('TRASLADOS_UPD') !== -1 && traslado.TRSTS === 3 ? <Text style={styles.small2}>Pulse para confirmar la cantidad real del producto:</Text>:''}
                </VStack>

                <VStack w={traslado.TRSTS >= 3 ? "22.5%":"35%"}>
                    <Text style={styles.subtitle}>Cant. Unitaria Esperada</Text>
                    <Text style={styles.quantity}>{parseInt(item.TCANT)}</Text>
                    {item.CHARG && <Text style={styles.subtitle}>Lote:</Text> }
                    {item.CHARG && <Text style={styles.lote}>{item.CHARG}</Text>}
                </VStack>

                {traslado.TRSTS >= 3 && <VStack w="25%">
                    <Text style={styles.subtitle}>Cant. Unitaria Confirmada</Text>
                    <Text style={[styles.quantity,{color: item.CANTR != null && item.CANTR !== item.TCANT ? 'red':'green'}]}>{item.CANTR == null ? '-':item.CANTR}</Text>
                </VStack>}
            </HStack>
        </TouchableHighlight>
    ;

    const DialogoInfo = () =>
    <Dialog visible={showInfo} onDismiss={() => setShowInfo(false)} >
        <DialogHeader title={traslado.TRCON}/>
        <DialogContent >
            <HStack spacing={4}>
                <Text style={styles.title2}>Creado Por:</Text>
                <Text style={styles.subtitle}>{`${traslado.CreadoPor?.USNAM||""} ${traslado.CreadoPor?.USLAS||""}`}</Text>
            </HStack>
            {traslado.ActualizadoPor ? <HStack spacing={4}>
                <Text style={styles.title2}>Actualizado Por:</Text>
                <Text style={styles.subtitle}>{`${traslado.ActualizadoPor?.USNAM||""} ${traslado.ActualizadoPor?.USLAS||""}`}</Text>
            </HStack>:''}
            <HStack spacing={4}>
                <Text style={styles.title2}>Fecha:</Text>
                <Text style={styles.subtitle}>{traslado.DATEC.split("T")[0]+" "+traslado.DATEC.split("T")[1].substring(0,5)}</Text>
            </HStack>
            <HStack spacing={4}>
                <Text style={styles.title2}>Origen:</Text>
                <Text style={styles.subtitle}>{traslado.DesdeCentro?.NAME1}{"\n"}({traslado.DesdeCentro?.Almacenes[0]?.LGOBE})</Text>
            </HStack>
            <HStack spacing={4}>
                <Text style={styles.title2}>Destino:</Text>
                <Text style={styles.subtitle}>{traslado.HaciaCentro?.NAME1}{"\n"}({traslado.HaciaCentro?.Almacenes[0]?.LGOBE})</Text>
            </HStack>
            <HStack spacing={4}>
                <Text style={styles.title2}>Ubicación:</Text>
                <Text style={styles.subtitle}>{traslado.Paletas?.length && traslado.Paletas[0].Ordene?.TLATI && traslado.Paletas[0].Ordene?.TLATI ?
                <Button title="Ver en maps" color={Global.colorMundoTotal} variant="outlined" style={{fontSize: 13, marginTop: -10, alignSelf: 'flex-end'}}
                    trailing={<MI name="google-maps" size={24} />}
                    onPress={() => Linking.openURL('https://www.google.com/maps/place/'+traslado.Paletas[0].Ordene.TLATI+','+traslado.Paletas[0].Ordene.TLONG)}
                />:'Aún no tenemos información\nde la ubicación actual'
                }</Text>
            </HStack>
        </DialogContent>
        <DialogActions>
            <Button
                title="Ok"
                compact
                variant="text"
                onPress={() => setShowInfo(false)}
            />
        </DialogActions>
    </Dialog>
    ;
                /* HACER VALIDACIÓN EN SAP SI EL ARTICULO NO EXISTE */
    const confirmarCantidad = (its, item) => {
        let datos = {
            id: item.IDTRI,
            update: {
                CANTR: item.CANTR
            }
        }
        setLoading(true);

        fetchIvan(props.ipSelect).put('/crudTrasladoItems', datos, props.token.token)
        .then(({data}) => {
            console.log(data);
            if(scanSelect.MATNR === item.MATNR) {
                setScan({...scanSelect, ...item});
            }
            setItems(its);
            setDialogItem({});
            setDialogVisible(false);
            
            ToastAndroid.show(
                "Cantidad actualizada con éxito",
                ToastAndroid.SHORT
            );
        })
        .catch(({status, error}) => {
            console.log(status, error);
            if(error && typeof(error) !== 'object' && error.indexOf("request failed") !== -1) {
                setMsgConex("¡Ups! Parece que no hay conexión a internet");
            }
            if(status === 406) {
                setTraslado({...traslado, TRSTS: error.status});
                props.route.params.updateTras({...traslado, TRSTS: error.status});
                props.navigation.goBack();
                
                return ToastAndroid.show(
                    error?.text || "Solicitud no aceptada, por el servidor",
                    ToastAndroid.LONG
                );
            }
            return ToastAndroid.show(
                error?.text || error?.message || (error && typeof(error) !== 'object' && error.indexOf("request failed") !== -1 ? "Por favor chequea la conexión a internet":"Error interno, contacte a administrador"),
                ToastAndroid.SHORT
            );
        })
        .finally(() => {
            setLoading(false);
        });

    }

    const memoRows = useCallback((item, index) => RowProducts(item, index), [items, scanSelect.Producto ? scanSelect.Producto.MATNR:undefined, traslado, onlyPalet])

    const memoGet = useCallback(() => getItems());

    return (
        <Provider>
            <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
                <DialogHeader title="Confirma la cantidad real del producto" />
                <DialogContent>
                    <Stack spacing={2}>
                        <Text style={styles.title2}>{dialogItem.MAKTG}</Text>
                        <Text style={styles.subtitle}>{dialogItem.MATNR}</Text>
                        <HStack  style={{alignItems: 'center'}}>
                            <Text style={styles.subtitle}>Unidad base del producto es: </Text>
                            <Text style={styles.title2}>{dialogItem.UnidadBase?.UnidadDescripcion?.MSEHL?.toUpperCase()}</Text>
                        </HStack>
                        <HStack style={{alignItems: 'center', marginTop: 5}}>
                            <Text style={styles.subtitle}>Cantidad Unitaria Esperada:</Text>
                            <Text style={[styles.quantity, {marginStart: 10}]}>{parseInt(dialogItem.TCANT)}</Text>
                        </HStack>

                        <Text style={styles.subtitle}>Cantidad Unitaria Real: </Text>
                        <TextInput defaultValue={dialogItem.CANTR?.toString() || dialogItem.TCANT?.toString()} 
                            autoFocus={true}
                            variant="outlined"
                            keyboardType="numeric"
                            ref={elInput}
                            editable={!loading}
                            onChangeText={(cant) => { elInput.current?.setNativeProps({text: cant ? parseInt(cant.replace(/\D/g, '')).toString():'0'}); setDialogItem({...dialogItem, CANTR: parseInt(cant ? cant.replace(/\D/g, ''):'0')});} }
                            onEndEditing={(e) => setDialogItem({...dialogItem, CANTR: parseInt(e.nativeEvent.text)})} 
                            maxLength={10}/>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button
                        title="Confirmar"
                        compact
                        variant="text"
                        loading={loading}
                        disabled={loading}
                        onPress={() => {
                            if(dialogItem?.CANTR === null) {
                                return Alert.alert("Error", "Por favor ingresa una cantidad valida");
                            }
                            let its = JSON.parse(JSON.stringify(items));
                            for(let it of its) {
                                if(it.IDTRI === dialogItem.IDTRI) {
                                    it.CANTR = dialogItem.CANTR || 0
                                    break;
                                }
                            }
                            confirmarCantidad(its, dialogItem);
                        }}
                    />
                </DialogActions>
            </Dialog>

            <Stack spacing={0} m={2} mb={-4}>
                {!loading && msgConexion ? <Text style={{padding: 3, backgroundColor: 'red', color: 'white', textAlign: 'center', fontSize: 12}}>{msgConexion}</Text>:''}
                <ScrollView ref={scrollShow} nestedScrollEnabled = {true} refreshControl={<RefreshControl refreshing={false} onRefresh={()=> memoGet(true)}/>}>
                    <DialogoInfo/>
                    <Text style={[styles.subtitle, {alignSelf: 'flex-end'}]} onPress={() => setShowInfo(!showInfo)}><Entypo name="info-with-circle" size={16} color={Global.colorMundoTotal}/> Info Traslado</Text>

                    <Text style={[styles.title1, {marginTop: 0}]}>{Global.displayName}</Text>
                    {traslado.TRSTS == 3 ? 
                        <View> 
                            <AccionesEscaneo/> 
                            <Box style={styles.box1}>
                                {scanSelect.Producto ?
                                <Stack spacing={0}>
                                    <ImagesAsync ipSelect={props.ipSelect}  imageCode={scanSelect.MATNR} token={props.token.token}/>
                                    <HStack spacing={6}>
                                        <Text style={styles.title2}>Código:</Text>
                                        <Text style={styles.subtitle}>{scanSelect.unidad_index?.EAN11}</Text>
                                    </HStack>
                                    {
                                    items.map((item, i) => 
                                        item.MATNR === scanSelect.MATNR && 
                                        <VStack spacing={2} key={i} style={{borderBottomWidth: 0.4}} p={2}>
                                            <TouchableHighlight
                                                activeOpacity={0.6}
                                                underlayColor="#DDDDDD"
                                                onPress={() => {
                                                    if(props.dataUser.USSCO.indexOf('TRASLADOS_UPD') !== -1 && traslado.TRSTS === 3) {
                                                        console.log(item)
                                                        setDialogItem({...item, CANTR: item.CANTR || item.TCANT})
                                                        setDialogVisible(true);
                                                    }
                                                }}>
                                                <HStack spacing={6}>
                                                    <VStack>
                                                        {item.CHARG &&<HStack>
                                                            <Text style={styles.title2}>Lote:</Text>
                                                            <Text style={styles.subtitle} color="primary">{item.CHARG} | </Text>
                                                        </HStack>}
                                                        <HStack spacing={5} style={{alignItems: 'center'}}>
                                                            <Text style={styles.subtitle}>Paleta:</Text>
                                                            <Text style={styles.subtitle}>{item.IDPAL.substr(-3).padStart(3, '0')}</Text>
                                                        </HStack>
                                                    </VStack>
                                                    <VStack >
                                                        <HStack spacing={5} style={{alignItems: 'center'}}>
                                                            <Text style={styles.subtitle}>Cant Esperada:</Text>
                                                            <Text style={styles.quantity}>{item.TCANT}</Text>
                                                        </HStack>
                                                        <HStack spacing={5} style={{alignItems: 'center'}}>
                                                            <Text style={styles.subtitle}>Cant Confirmada:</Text>
                                                            <Text style={[styles.quantity,{color: item.CANTR != null && item.CANTR !== item.TCANT ? 'red':'green'}]}>{item.CANTR == null ? '-':item.CANTR}</Text>
                                                        </HStack>
                                                    </VStack>
                                                </HStack>
                                            </TouchableHighlight>
                                        </VStack>
                                    )}
                                    <HStack spacing={6}>
                                        <Text style={styles.title2}>Unidad de escaneo:</Text>
                                        <Text style={styles.subtitle}>{scanSelect.unidad_index?.UnidadDescripcion?.MSEHL || ""}</Text>
                                    </HStack>
                                    {scanSelect.noBase && <Text style={styles.subtitle}>({parseInt(scanSelect.unidad_index.UMREZ)+" "+scanSelect.Producto.UnidadBase?.UnidadDescripcion?.MSEHL+". Por "+(scanSelect.unidad_index?.UnidadDescripcion?.MSEHL || "")})</Text>}
                                    <HStack spacing={6} mt={4}>
                                        <Text style={styles.title2}>Producto:</Text>
                                        <Text style={styles.subtitle}>{scanSelect.MAKTG}</Text>
                                    </HStack>
                                    <Text style={styles.subtitle}>{scanSelect.Producto.MATNR}</Text>
                                </Stack>:''}
                            </Box>
                        </View>
                    : '' }
                    {loading && <ActivityIndicator />}
                    <Stack style={styles.escaneados}>
                        <HStack spacing={2} style={{justifyContent: 'space-between', alignItems: 'center'}}>
                            <Text style={styles.title2}>Productos escaneados ({items.length}):</Text>
                            
                            {props.dataUser.USSCO.indexOf('TRASLADOS_UPD') !== -1 && traslado.TRSTS === 3 && items.length && 
                                <Button compact={true} title="Recibir" onPress={recibirTraslado} disabled={loading}/>}
                        </HStack>

                        {props.route.params.IDPAL &&
                        <HStack style={{alignItems:'center'}}>
                            <Text style={styles.small2}>Ver solo paleta {props.route.params.IDPAL.substr(-3).padStart(3, '0')}</Text>
                            <Switch value={onlyPalet} onValueChange={() => setOnlyPalet(!onlyPalet)} autoFocus={false}/> 
                        </HStack>}

                        <ListaPerform
                            items={onlyPalet ? items.filter((v) => v.IDPAL == props.route.params.IDPAL):items} 
                            renderItems={memoRows} 
                            heightRemove={traslado.TRSTS >= 3 && traslado.TRSTS < 5 ? ((scanSelect && scanSelect.Producto ) ? 125:260):160}
                            //refreshGet={memoGet}
                        />
                    </Stack>
                    <View style={{ width: 200, height: 10 }}></View>
                </ScrollView>
            </Stack>
        </Provider>
    )
}
const styles = StyleSheet.create({
    title1: {
        alignSelf: 'center',
        fontSize: 16,
        fontWeight: 'bold'
    },
    title2: {
        zIndex: 9,
        fontSize: 14,
        fontWeight: '500'
    },
    small: {
        fontSize: 10
    },
    small2: {
        fontSize: 11,
    },
    subtitle: {
        fontSize: 13,
    },
    box: {
        marginTop: 10,
        padding: 5,
        backgroundColor: "lightgrey",
        borderBottomLeftRadius: 5,
        borderBottomRightRadius: 5,
        borderTopLeftRadius: 5,
        borderTopRightRadius: 5
    },
    box1: {
        zIndex: 10,
        backgroundColor: "lightgrey",
        padding: 5,
        width: '100%'
    },
    escaneados: {
        marginTop: 10,
        zIndex: 9
    },
    items: {
        justifyContent: 'space-between', 
        marginBottom: 1, 
        borderBottomWidth: 1
    },
    quantity: {
        fontSize: 18,
        fontWeight: 'bold',
        alignSelf: 'center'
    },
    lote: {
        fontSize: 12,
        fontWeight: 'bold'
    }
});

export default VerItems;