import { ActivityIndicator, Box, Button, Dialog, DialogActions, DialogContent, DialogHeader, HStack, IconButton, Provider, Stack, Switch, Text, TextInput, VStack } from "@react-native-material/core";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, LogBox, RefreshControl, ScrollView, StyleSheet, ToastAndroid, View } from "react-native";
import KeyEvent from 'react-native-keyevent';
import RNBeep from "react-native-a-beep";

/* Librerias de IVAN */
import fetchIvan from "../components/_fetch";
import ListaPerform from "../components/_virtualList";
import SelectInput from "../components/_virtualSelect";
import ImagesAsync from "../components/_imagesAsync";
/* Librerias de IVAN */

/* IMPORT ICONS */
import AntDesign from "react-native-vector-icons/AntDesign";
import Entypo from "react-native-vector-icons/Entypo";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
/* IMPORT ICONS */

const Global = require('../../app.json');

var sesionTimout = null;

LogBox.ignoreLogs([
    'Non-serializable values were found in the navigation state',
]);

const ScaneoPedido = (props) => {
    const traslado = props.route.params.traslado;
    const IDPAL = props.route.params.IDPAL;

    const [loading, setLoading] = useState(true);
    const [loadingSave, setLoadingSave] = useState(false);
    const [msgConexion, setMsgConex] = useState('');
    const [showInfo, setShowInfo] = useState('');
    const [cronometro, setCronometro] = useState({});

    /** CONFIG **/
    const [showKeyBoard, setShowKeyBoard] = useState(false);
    const [autosumar, setAutoSumar] = useState(true);
    const [autoinsert, setAutoInsert] = useState(true);
    /** CONFIG **/
    
    const [trasladoItems, setTrasladoItems] = useState([]);
    const pedido = props.pedido;

    const [scanCurrent, setScanCurrent] = useState({});
    const [rackSel, setRackSel] = useState(null);

    /** Referencias a componentes **/
    const mounted = useRef(null);
    const scrollPrincipal = useRef(null);
    const inputScan = useRef(null); // Input principal
    const inputCant1 = useRef(null); // Input cantidad escaneo
    const inputCantList = useRef(null); // Input cantidad escaneo
    /** Referencias a componentes **/

    /* EVENTO KEYBOARD */
    const evento = (keyEvent) => { 
        console.log(`Key: ${keyEvent.pressedKey}`);
        console.log(`onKeyUp keyCode: ${keyEvent.keyCode}`);
        try {
            if(!inputScan.current?.isFocused() && !inputCantList.current?.isFocused() && !inputCant1.current?.isFocused()) {
                if((keyEvent.keyCode >= 520 && keyEvent.keyCode <= 523) || keyEvent.keyCode === 103 || keyEvent.keyCode === 10036) { // Nos llaman con enter
                    console.log("Activamos ")
                    inputScan.current?.focus();
                    scrollPrincipal.current?.scrollTo({y: 20, animated: true});
                }

                if(keyEvent.keyCode >= 29 && keyEvent.keyCode <= 54) { // A-Z
                    if(inputScan.current) {
                        inputScan.current.focus();
                        inputScan.current.setNativeProps({ text: keyEvent.pressedKey })
                        scrollPrincipal.current?.scrollTo({y: 20, animated: true});
                    }
                } else if(keyEvent.keyCode >= 7 && keyEvent.keyCode <= 16) { // 0-9
                    if(inputScan.current) {
                        inputScan.current.focus();
                        inputScan.current.setNativeProps({ text: keyEvent.pressedKey })
                        scrollPrincipal.current?.scrollTo({y: 20, animated: true});
                    }
                }
            }
        } catch(e) {
            console.log(e);
        }
    }

    /* Efecto montura componente */
    useEffect(() => {
        mounted.current = true;
        getSesionScan();
        getTrasladoItems();
        
        if(traslado.TRSTS === 1) {
            KeyEvent.onKeyDownListener(evento);

            return () => {
                mounted.current = false;
                if(sesionTimout) {
                    clearTimeout(sesionTimout);
                }
                KeyEvent.removeKeyDownListener();
            }
        }

        return () => {
            mounted.current = false;
            if(sesionTimout) {
                clearTimeout(sesionTimout);
            }
        }
    }, []);
    /* Efecto montura componente */

    /* Efecto al seleccionar ubicacion reiniciamos cantidad */
    useEffect(() => {
        if(rackSel !== null && scanCurrent.MATNR){
            setScanCurrent({...scanCurrent, TCANT: 0});
        }
    }, [rackSel]);

    /* Efecto al realizar llamado a la API reiniciamos el msj de error */
    useEffect(() => {
        if(loading) {
            setMsgConex("");
        }
    }, [loading === true]);

    /* Funciones fetch init() */
    function getSesionScan() {
        const datos = [
            `IDTRA=${traslado.IDTRA}`,
            `IDPAL=${IDPAL}`
        ];
        fetchIvan(props.ipSelect).get('/sesionScan', datos.join('&'), props.token.token, undefined, undefined, 60000) // 1 minuto para probar
        .then(({data}) => {
            setCronometro({
                ...data.data,
                loaded: true
            });
        })
        .catch(({status, error}) => {
            if(error && typeof(error) !== 'object' && error.indexOf("request failed") !== -1) {
                setMsgConex("¡Ups! Parece que no hay conexión a internet");
            }
            ToastAndroid.show(
                error?.text || error?.message || (error && typeof(error) !== 'object' && error.indexOf("request failed") !== -1 ? "Por favor chequea la conexión a internet":"Error interno, contacte a administrador"),
                ToastAndroid.SHORT
            );
            if(mounted.current)
                sesionTimout = setTimeout(() => getSesionScan(), 3000); // Retry for 3 seconds
        })
    }

    const iniciarEscaneo = () => {
        const datos = {
            IDTRA: traslado.IDTRA,
            IDPAL: props.route.params.IDPAL
        };

        setLoading(true);
        fetchIvan(props.ipSelect).post('/sesionScan', datos, props.token.token, undefined, undefined, 60000) // 1 minuto para probar
        .then(({data}) => {
            console.log(data.data);
            setCronometro({
                ...data.data,
                loaded: true
            });
        })
        .catch(({status, error}) => {
            //console.log(error);
            if(error && typeof(error) !== 'object' && error.indexOf("request failed") !== -1) {
                setMsgConex("¡Ups! Parece que no hay conexión a internet");
            }
            ToastAndroid.show(
                error?.text || error?.message || (error && typeof(error) !== 'object' && error.indexOf("request failed") !== -1 ? "Por favor chequea la conexión a internet":"Error interno, contacte a administrador"),
                ToastAndroid.SHORT
            );
        })
        .finally(() => {
            setLoading(false);
        })
    }

    function getTrasladoItems(forceCheck = false) { // El force check es para avisar al usuario si hay productos con stock sobre pasados
        let datos = [
            `find={"IDTRA": ${traslado.IDTRA}}`,
            `fromWERKS=${traslado.FWERK}`,
            `fromLGORT=${traslado.FLGOR}`,
            `checkProducts=${traslado.TRSTS === 1}`,
            `simpleData=true`
        ];
        
        setLoading(true);
        return new Promise((resolve) => {
            let passed = 0;
            fetchIvan(props.ipSelect).get('/crudTrasladoItems', datos.join('&'), props.token.token, undefined, undefined, 60000) // 1 minuto para probar
            .then(({data}) => {
                if(data.data.length) passed = true;
                if(traslado.TRSTS === 1) {
                    for(let producto of data.data) {
                        const unidadBase = producto.Producto.UnidadBase?.MEINS || "ST";
                        try {
                            if(producto.Producto.UnidadBase?.XCHPF === 'X') { // CON LOTES
                                producto.maxQuantityLote = {};
                                for(let lote of producto.Producto.ProdConLote) {
                                    producto.maxQuantityLote[lote.CHARG] = parseInt(lote.CLABS)-parseInt(lote.RESERVADOS ?? 0);
                                }
                            } else {
                                producto.maxQuantity = parseInt(producto.Producto.ProdSinLote[0]?.LABST || 0)-parseInt(producto.Producto.ProdSinLote[0]?.RESERVADOS ?? 0);
                            }
                            producto.unidad_index = producto.Producto.UnidadBase;
                            producto.noBase = false;
                            
                            if(forceCheck) {
                                if(producto.CHARG) {//Lote
                                    if(producto.TCANT > producto.maxQuantityLote[producto.CHARG]) {
                                        Alert.alert("Exceso de cantidad", "El producto: "+producto.MAKTG+". Lote: "+producto.CHARG+"\nExcede la cantidad disponible, por favor chequea la lista.");
                                        passed = false;
                                    }
                                } else {
                                    if(producto.TCANT > producto.maxQuantity) {
                                        Alert.alert("Exceso de cantidad", "El producto: "+producto.MAKTG+". Excede la cantidad disponible, por favor chequea la lista.");
                                        passed = false;
                                    }
                                }
                            }
                        } catch (e) {
                            console.log(e);
                        }
                    }
                }
                setTrasladoItems(data.data);
                ToastAndroid.show("Productos actualizados correctamente", ToastAndroid.SHORT)
            })
            .catch(({status, error}) => {
                //console.log(error);
                if(error && typeof(error) !== 'object' && error.indexOf("request failed") !== -1) {
                    setMsgConex("¡Ups! Parece que no hay conexión a internet");
                }
                ToastAndroid.show(
                    error?.text || error?.message || (error && typeof(error) !== 'object' && error.indexOf("request failed") !== -1 ? "Por favor chequea la conexión a internet":"Error interno, contacte a administrador"),
                    ToastAndroid.SHORT
                );
                passed = false;
            })
            .finally(() => {
                setLoading(false);
                resolve(passed);
            });
        })
    }
    /* Funciones fetch */

    /* Funciones Scan */
    const findCode = (text) => {
        let scancode = text?.split(',')[0]?.match(/([A-Z|a-z|0-9])/g) ?? null;
        scancode = scancode?.join('') ?? null;
        if(!scancode) return;

        inputScan.current?.clear(); // Limpiamos el input
        
        if(scanCurrent && scancode === scanCurrent.unidad_index?.EAN11) { // Si el escaneado es el mismo 
            if(autosumar && rackSel !== null) {
                let producto = JSON.parse(JSON.stringify(scanCurrent));
                let maximoPosible = 0;
                if(!producto.maxQuantityLote) {
                    maximoPosible = producto.noBase && producto.max_paquete == 0 ? 
                                (producto.ubicaciones[rackSel].MAX < producto.max_paquete ? producto.ubicaciones[rackSel].MAX:producto.max_paquete):
                                (producto.ubicaciones[rackSel].MAX < producto.maxQuantity ? producto.ubicaciones[rackSel].MAX:producto.maxQuantity);
                } else {
                    maximoPosible = producto.noBase && producto.max_paquete[producto.CHARG] == 0 ? 
                                (producto.ubicaciones[rackSel].MAX < producto.max_paquete[producto.CHARG] ? producto.ubicaciones[rackSel].MAX:producto.max_paquete[producto.CHARG]):
                                (producto.ubicaciones[rackSel].MAX < producto.maxQuantityLote[producto.CHARG] ? producto.ubicaciones[rackSel].MAX:producto.maxQuantityLote[producto.CHARG]);
                }

                if(maximoPosible <= 0) {
                    RNBeep.beep(false);
                    return ToastAndroid.show("Has alcanzado la cantidad máxima", ToastAndroid.SHORT);
                }
                producto.TCANT = parseInt(producto.TCANT ?? 0) + (maximoPosible < parseInt(producto.unidad_index.UMREZ) ? maximoPosible:parseInt(producto.unidad_index.UMREZ));
                
                if(producto.TCANT > maximoPosible) {
                    producto.TCANT = maximoPosible;
                }
                setScanCurrent(producto);
                if(autoinsert) {
                    setTimeout(() => saveProduct(producto),10);
                }
                if(producto.TCANT >= maximoPosible) {
                    RNBeep.beep(false);
                    return ToastAndroid.show("Has alcanzado la cantidad máxima", ToastAndroid.SHORT);
                }
                return RNBeep.beep(true);
            } else {
                return RNBeep.PlaySysSound(RNBeep.AndroidSoundIDs.TONE_CDMA_PIP);
            }
        } else { // Si no es el mismo procedemos a buscarlo en la lista de pedido.
            setScanCurrent({});
            setRackSel(null);
            let producto = {};
            for(const ped of pedido) {
                for(const unidad of ped.Producto.ProductosUnidads) {
                    if(unidad.EAN11 !== scancode) continue;
                    producto = ped;
                    producto.unidad_index = unidad;
                    try {  
                        const unidadBase = producto.UnidadBase?.MEINS || "ST";
                        if(unidadBase.XCHPF === 'X') { // Con lote
                            producto.maxQuantityLote = {
                                [producto.CHARG]: parseInt(producto.ProdConLote.CLABS)-parseInt(producto.RESERVADOS ?? 0)
                            };

                            if(unidad.MEINH !== unidadBase) { // ST ES UNIDAD
                                producto.noBase = true;
                                producto.max_paquete = {};
                                producto.max_paquete[producto.CHARG] = Math.floor(producto.maxQuantityLote[producto.CHARG]/unidad.UMREZ);
                            } else {
                                producto.noBase = false;
                            }
                            producto.lotes = [{
                                label: producto.CHARG,
                                value: producto.CHARG,
                                subLabel: producto.ProdConLote.LAEDA+" - (Cant. "+producto.maxQuantityLote[producto.CHARG]+")"
                            }];
                        } else {
                            producto.maxQuantity = parseInt(producto.ProdSinLote?.LABST ?? 0)-parseInt(producto.RESERVADOS ?? 0);
                            if(unidad.MEINH !== unidadBase) { // ST ES UNIDAD
                                producto.noBase = true;
                                producto.max_paquete = Math.floor(producto.maxQuantity/unidad.UMREZ);
                            } else {
                                producto.noBase = false;
                            }
                        }

                        let contar = 0, idx = 0;
                        let ubicaciones = [];
                        console.log("Hola");
                        for(const ubi of producto.ArticulosBodegas) {
                            let cantDisp = parseInt(ubi.QUANT ?? 0)-parseInt(ubi.RESERVADOS ?? 0);
                            ubicaciones.push({
                                label: "Paleta ID: "+ubi.IDDWA,
                                subLabel: `${ubi.Bodega.FLOOR}-${ubi.Bodega.AISLE}-${ubi.Bodega.COLUM}-${ubi.Bodega.RACKS}-${ubi.Bodega.PALET} - (Cant. ${cantDisp})`,
                                value: idx,
                                MAX: cantDisp,
                                VALOR: ubi.IDDWA,
                                UBI: ubi.IDADW
                            });
                            contar += cantDisp;
                            idx++;
                        }
                        console.log(ubicaciones);
                        let diff = (unidadBase.XCHPF !== 'X' ? producto.maxQuantity:producto.maxQuantityLote[producto.CHARG])-contar;
                        if(diff > 0) {
                            ubicaciones.push({
                                label: 'S/N Ubicación',
                                subLabel: 'Cant. '+diff,
                                value: idx,
                                MAX: diff,
                                VALOR: 'sap',
                                UBI: null
                            });
                        }
                        producto.ubicaciones = ubicaciones;

                        return setScanCurrent(producto);
                        
                        // No podemos sumar porque necesita la ubicación ajuro.
                        /*if(unidadBase.XCHPF !== 'X') { 
                            if(producto.noBase) { // No es es la BASE si no otra unidad
                                producto.TCANT = producto.max_paquete == 0 ? producto.maxQuantity:parseInt(producto.unidad_index.UMREZ);
                            } else {
                                producto.TCANT = producto.maxQuantity > 0 ? 1:0;
                            }
                            if(producto.TCANT >= parseInt(producto.maxQuantity)) {
                                RNBeep.beep(false);
                                ToastAndroid.show("Has alcanzado la cantidad máxima", ToastAndroid.SHORT);
                            }
                        } else {
                            if(producto.noBase) { // No es es la BASE si no otra unidad
                                producto.TCANT = producto.max_paquete[producto.CHARG] == 0 ? producto.maxQuantityLote[producto.CHARG]:parseInt(producto.unidad_index.UMREZ);
                            } else {
                                producto.TCANT = producto.maxQuantityLote[producto.CHARG] > 0 ? 1:0;
                            }
                            if(producto.TCANT >= parseInt(producto.maxQuantityLote[producto.CHARG])) {
                                RNBeep.beep(false);
                                ToastAndroid.show("Has alcanzado la cantidad máxima", ToastAndroid.SHORT);
                            }
                        }*/
                    } catch (e) {
                        console.log(e);
                    }
                }
            }
        }
        RNBeep.beep(false);
        ToastAndroid.show("No hemos encontrado el artículo en la lista del pedido", ToastAndroid.SHORT);
    }

    const changeQuantity = (cantidad) => {
        if(rackSel === null) return;
        let cant = '';
        try {
            cant = cantidad.match(/^[0-9]*$/g)[0];
            if(cant && cant[0] === '0') 
                cant = cant.substring(1,cant.length);
        } catch {
        }
        let producto = JSON.parse(JSON.stringify(scanCurrent));
        if(!cant) {
            setScanCurrent({...producto, TCANT: 0});
            return inputCant1.current?.setNativeProps({text: cant});
        }
        let maximoPosible = 0;
        if(!producto.maxQuantityLote) {
            maximoPosible = producto.noBase && producto.max_paquete == 0 ? 
                        (producto.ubicaciones[rackSel].MAX < producto.max_paquete ? producto.ubicaciones[rackSel].MAX:producto.max_paquete):
                        (producto.ubicaciones[rackSel].MAX < producto.maxQuantity ? producto.ubicaciones[rackSel].MAX:producto.maxQuantity);
        } else {
            maximoPosible = producto.noBase && producto.max_paquete[producto.CHARG] == 0 ? 
                        (producto.ubicaciones[rackSel].MAX < producto.max_paquete[producto.CHARG] ? producto.ubicaciones[rackSel].MAX:producto.max_paquete[producto.CHARG]):
                        (producto.ubicaciones[rackSel].MAX < producto.maxQuantityLote[producto.CHARG] ? producto.ubicaciones[rackSel].MAX:producto.maxQuantityLote[producto.CHARG]);
        }
        if(parseInt(cant) > parseInt(maximoPosible)) {
            setScanCurrent({...producto, TCANT: parseInt(maximoPosible)});
        } else {
            setScanCurrent({...producto, TCANT: parseInt(cant)});
        }
    }

    function saveProduct(producto, fromButton) {
        console.log(producto);
        if(rackSel === null || !producto.TCANT || producto.TCANT <= 0 || 
            producto.TCANT > producto.ubicaciones[rackSel].MAX || producto.TCANT > producto.ubicaciones[rackSel].MAX || 
            (producto.maxQuantityLote && producto.TCANT > producto.maxQuantityLote[producto.CHARG]) || (producto.maxQuantity && producto.TCANT > producto.maxQuantity)) {
            RNBeep.beep(false);
            return ToastAndroid.show(
                "Por favor establece una cantidad dentro de los limites de lote y ubicación.",
                ToastAndroid.SHORT
            );
        }
        let existe = trasladoItems.filter(f => f.MATNR === producto.MATNR && f.CHARG === producto.CHARG && f.IDADW === producto.ubicaciones[rackSel].UBI);
        console.log("Existe ", existe.length);
        let sumado = parseInt(producto.TCANT);
        for(let item of trasladoItems) {
            if(item.id !== producto.IDTRI) {
                if(item.MATNR === producto.MATNR && item.CHARG == producto.CHARG) {
                    sumado += item.CANTP;
                }
            }
        }
        if(sumado > producto?.CANTP) {
            RNBeep.beep(false);
            return ToastAndroid.show(
                "La cantidad colocada es mayor a la cantidad requerida.",
                ToastAndroid.SHORT
            );
        }

        setLoadingSave(true);
        if(!existe.length) {
            let datos = {
                create: {
                    IDTRA: traslado.IDTRA,
                    MATNR: producto.Producto.MATNR,
                    MAKTG: producto.Producto.MAKTG,
                    TCANT: parseInt(producto.TCANT),
                    UCRID: props.dataUser.IDUSR,
                    UMOID: props.dataUser.IDUSR,
                    IDPAL: IDPAL,
                    IDADW: producto.ubicaciones[rackSel].UBI,
                    CHARG: producto.CHARG
                }
            }

            fetchIvan(props.ipSelect).post('/crudTrasladoItems', datos, props.token.token)
            .then(({data}) => {
                console.log("Producto insertado", data.data);
                setTrasladoItems([{...producto, ...data.data, CreadoPor: props.dataUser, ActualizadoPor: props.dataUser, Ubicacion: producto.ArticulosBodegas[rackSel]}, ...trasladoItems]);
                //setScanCurrent({...producto, ...data.data, CreadoPor: props.dataUser, ActualizadoPor: props.dataUser});

                ToastAndroid.show(
                    "Producto creado con éxito",
                    ToastAndroid.SHORT
                );
                inputScan.current?.focus();
            })
            .catch(({status, error}) => {
                //console.log(status, error);
                if(error && typeof(error) !== 'object' && error.indexOf("request failed") !== -1) {
                    setMsgConex("¡Ups! Parece que no hay conexión a internet");
                }
                if(status === 406) {
                    props.route.params.updateTras({...traslado, TRSTS: error.status});
                    props.navigation.goBack();
                    return ToastAndroid.show(
                        error?.text || "Solicitud no aceptada, por el servidor",
                        ToastAndroid.LONG
                    );
                }
                /*if(error.text?.indexOf("Validation error") !== -1 || error.text?.indexOf("No reconozco ese ID") !== -1) {
                    setScanCurrent({});
                    get(true);
                }*/
                return ToastAndroid.show(
                    error?.text || error?.message || (error && typeof(error) !== 'object' && error.indexOf("request failed") !== -1 ? "Por favor chequea la conexión a internet":"Error interno, contacte a administrador"),
                    ToastAndroid.SHORT
                );
            })
            .finally(() => {
                setLoadingSave(false);
            });
        } else {
            let datos = {
                id: producto.IDTRI,
                update: {
                    TCANT: parseInt(producto.TCANT),
                    UMOID: props.dataUser.IDUSR
                }
            };
            fetchIvan(props.ipSelect).put('/crudTrasladoItems', datos, props.token.token)
            .then(({data}) => {
                console.log("Productos actualizado: ", data.data);
                let prod = JSON.parse(JSON.stringify(trasladoItems));
                for(let i=0;i < prod.length;i++) {
                    if(prod[i].IDTRI == producto.IDTRI) {
                        let aux = {...producto, ...datos.update, ActualizadoPor: props.dataUser};
                        prod[i] = JSON.parse(JSON.stringify(aux));
                        if(fromButton || scanCurrent.IDTRI === producto.IDTRI) // llamado desde el boton
                            setScanCurrent(prod[i]);
                        break;
                    }
                }
                setTrasladoItems(prod);
                ToastAndroid.show(
                    "Cantidad actualizada con éxito",
                    ToastAndroid.SHORT
                );
            })
            .catch(({status, error}) => {
                //console.log(error);
                if(error && typeof(error) !== 'object' && error.indexOf("request failed") !== -1) {
                    setMsgConex("¡Ups! Parece que no hay conexión a internet");
                }
                if(error.text?.indexOf("Validation error") !== -1 || error.text?.indexOf("No reconozco ese ID") !== -1) {
                    setScan({});
                    getItems(true);
                }
                return ToastAndroid.show(
                    error?.text || error?.message || (error && typeof(error) !== 'object' && error.indexOf("request failed") !== -1 ? "Por favor chequea la conexión a internet":"Error interno, contacte a administrador"),
                    ToastAndroid.SHORT
                );
            })
            .finally(() => {
                setLoadingSave(false);
            });
        }
    }
    /* Funciones Scan */
    
    /* Componente Información */
    const DialogoInfo = () => 
        <Dialog visible={showInfo} onDismiss={() => setShowInfo(false)}>
            <DialogHeader title={traslado.TRCON}/>
            <DialogContent>
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
                    <Text style={styles.subtitle}>{traslado.TRACR.split("T")[0]+" "+traslado.TRACR.split("T")[1].substring(0,5)}</Text>
                </HStack>
                <HStack spacing={4}>
                    <Text style={styles.title2}>Origen:</Text>
                    <Text style={styles.subtitle}>{traslado.DesdeCentro?.NAME1}{"\n"}({traslado.DesdeCentro?.Almacenes[0]?.LGOBE})</Text>
                </HStack>
                <HStack spacing={4}>
                    <Text style={styles.title2}>Destino:</Text>
                    <Text style={styles.subtitle}>{traslado.HaciaCentro?.NAME1}{"\n"}({traslado.HaciaCentro?.Almacenes[0]?.LGOBE})</Text>
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
    
    /* Componente Información */

    /* Componente de lista */
    const RowProducts = (item, index) => 
        item.TCANT > 0 &&
        <HStack
            key={index}
            spacing={4}
            style={[styles.items,(scanCurrent.Producto?.MATNR === item.MATNR ? {backgroundColor: 'lightgreen'}:{}), {width: '100%'}]}
        >
            <VStack w="55%">
                <Text style={styles.title2}>{item.MAKTG || item.Producto.MAKTG || ""}</Text>
                <Text style={[styles.subtitle, {backgroundColor: 'yellow'}]}>{item.unidad_index?.EAN11 || item.MATNR}</Text>
                {item.CHARG && traslado.TRSTS === 1 && <Text style={styles.subtitle} color="primary">Lote: {item.CHARG}</Text>}
                <Text style={styles.subtitle}>Usuario: {item.CreadoPor?.USNAM+" "+(item.CreadoPor?.USLAS ?? '')}</Text>
                <Text style={styles.subtitle} color="secondary">Ubicación: {item.Ubicacion?.Bodega?.FLOOR+"-"+item.Ubicacion?.Bodega?.AISLE+"-"+item.Ubicacion?.Bodega?.COLUM+"-"+item.Ubicacion?.Bodega?.RACKS+"-"+item.Ubicacion?.Bodega?.PALET}</Text>
            </VStack>

            {traslado.TRSTS === 1 ? <VStack w="25%" style={{alignSelf: 'flex-end'}}>
                <Text style={[styles.small2,((item.maxQuantityLote && item.TCANT > item.maxQuantityLote[item.CHARG]) 
                                                || (!item.maxQuantityLote && item.TCANT > item.maxQuantity)) ? {color: 'red'}:{}]}>
                    Max: {item.maxQuantityLote ? item.maxQuantityLote[item.CHARG]:item.maxQuantity}
                </Text>
                <TextInput
                    containerStyle={{fontSize: 5, padding: 0}} 
                    defaultValue={item.TCANT.toString()} 
                    numeric
                    textAlign={'center'}
                    //onChangeText={(text) => changeQuantity2(item, text)} 
                    keyboardType="numeric" 
                    inputContainerStyle={{
                        width: 75,
                        height: 45
                    }}
                    inputStyle={((item.maxQuantityLote && item.TCANT > item.maxQuantityLote[item.CHARG]) 
                        || (!item.maxQuantityLote && item.TCANT > item.maxQuantity)) ? {color: 'red', paddingEnd: 0, paddingStart: 0}:{paddingEnd: 0, paddingStart: 0}}
                    editable={!loadingSave}
                    pointerEvents="none"
                    //onBlur={(e) => updateProduct(item) }
                    onEndEditing={(e) => saveProduct({...item, TCANT: parseInt(e.nativeEvent.text ?? 0)}) }
                    ref={inputCantList}
                    maxLength={10}
                    />
                {/* <Text style={styles.subtitle}>{getCantUnidades(item)}</Text> */}
            </VStack>:
            <VStack w="30%">
                <Text style={styles.subtitle}>Cantidad:</Text>
                <Text style={styles.quantity}>{parseInt(item.TCANT)}</Text>
                {item.CHARG && <Text style={styles.subtitle}>Lote:</Text> }
                {item.CHARG && <Text style={styles.lote}>{item.CHARG}</Text>}
                {/* <Text style={styles.subtitle}>{getCantUnidades(item)}</Text> */}
            </VStack>}
            {traslado.TRSTS === 1 && props.dataUser.USSCO.indexOf('ADMIN_SCAN') !== -1 ?
                <IconButton icon={p2=p2 => <AntDesign name="delete" {...p2}/> } onPress={() => deleteItem(item.MAKTG, item.IDTRI)} style={{alignSelf: 'center'}}/>:''
            }
        </HStack>
    ;

    const memoRows = useCallback((item, index) => RowProducts(item, index), [trasladoItems, scanCurrent?.Producto ? scanCurrent.Producto.MATNR:undefined, loadingSave, traslado])
    /* Componente de lista */

    /* Otras funciones */
    const finalizarTraslado = async () => {

    };
    const deleteItem = (name, id) => {
        //console.log("Delete items")
        Alert.alert('Confirmar', `¿Deseas eliminar el ítem (${name}) realmente?`, [
            {
              text: 'Si deseo eliminar',
              style: 'destructive',
              onPress: () => {
                let datos = {
                    id: id
                };
                setLoading(true);
                fetchIvan(props.ipSelect).delete('/crudTrasladoItems', datos, props.token.token)
                .then(({data}) => {
                    console.log("Productos borrados: ", data.data);
                    setTrasladoItems(trasladoItems.filter(f => f.IDTRI !== id));
            
                    ToastAndroid.show(
                        "Producto eliminado con éxito",
                        ToastAndroid.SHORT
                    );
                })
                .catch(({status, error}) => {
                    //console.log(status, error);
                    if(error && typeof(error) !== 'object' && error.indexOf("request failed") !== -1) {
                        setMsgConex("¡Ups! Parece que no hay conexión a internet");
                    }
                    if(status === 406) {
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
            },
        },
        {
          text: 'No cancelar',
          style: 'cancel',
        }
    ]);
    }
    /* Otras funciones */

    return (
        <Provider>
            <Stack spacing={0} m={2} mb={-4}>
                {!loading && msgConexion ? <Text style={{padding: 3, backgroundColor: 'red', color: 'white', textAlign: 'center', fontSize: 12}}>{msgConexion}</Text>:''}
                <ScrollView ref={scrollPrincipal} nestedScrollEnabled = {true} refreshControl={<RefreshControl refreshing={false} onRefresh={()=> getTrasladoItems(true)}/>}>
                    <DialogoInfo/>

                    <HStack style={{justifyContent: 'space-between'}}>
                        <Crono cronometro={cronometro}/>
                        <Text style={[styles.subtitle]} onPress={() => setShowInfo(!showInfo)}><Entypo name="info-with-circle" size={16} color={Global.colorMundoTotal}/> Info Traslado</Text>
                    </HStack>
                    <Text style={[styles.title1, {marginTop: 0}]}>{Global.displayName}</Text>

                    {traslado.TRSTS === 1 ? 
                        cronometro.FINIC ?
                        <View> 
                            <VStack spacing={-8}>
                                <TextInput placeholder="Pulsa y escanea o tipea el código de barras" 
                                    onEndEditing={(e) => findCode(e.nativeEvent.text) }
                                    showSoftInputOnFocus={showKeyBoard}
                                    ref={inputScan}
                                    maxLength={18}
                                />

                                <HStack style={{alignItems:'center', alignSelf: 'center'}}>
                                    <Text style={styles.small2}>Activar teclado</Text>
                                    <Switch value={showKeyBoard} onValueChange={() => setShowKeyBoard(!showKeyBoard)} autoFocus={false}/> 
                                </HStack>

                                <HStack style={{justifyContent: 'space-between'}}>
                                    <HStack style={{alignItems:'center'}}>
                                        <Text style={styles.small2}>Auto sumar</Text>
                                        <Switch value={autosumar} onValueChange={() => setAutoSumar(!autosumar)} autoFocus={false}/>
                                    </HStack>
                                    <HStack style={{alignItems:'center'}}>
                                        <Text style={styles.small2}>Auto guardado</Text>
                                        <Switch value={autoinsert} onValueChange={() => setAutoInsert(!autoinsert)} autoFocus={false}/>
                                    </HStack>
                                </HStack>
                            </VStack>

                            <Box style={styles.box1}>
                                {scanCurrent && scanCurrent.MATNR ? 
                                <Stack spacing={0}>
                                    <HStack style={{justifyContent: 'space-between'}} spacing={4}>
                                        <VStack spacing={0} w={"65%"}>
                                            <HStack spacing={4}>
                                                <Text style={styles.title2}>Código:</Text>
                                                <Text style={styles.subtitle}>{scanCurrent.unidad_index?.EAN11}</Text>
                                            </HStack>
                                            <HStack spacing={4}>
                                                <Text style={styles.title2}>Und. de escaneo:</Text>
                                                <Text style={styles.subtitle}>{scanCurrent.unidad_index?.UnidadDescripcion?.MSEHL || ""}</Text>
                                                {scanCurrent.noBase && <Text style={styles.small3}>({scanCurrent.maxQuantityLote ? scanCurrent.max_paquete[0]:scanCurrent.max_paquete} completos)</Text>}
                                            </HStack>
                                            {scanCurrent.noBase && <Text style={styles.small3}>{parseInt(scanCurrent.unidad_index.UMREZ)+" "+scanCurrent.UnidadBase?.UnidadDescripcion?.MSEHL+". Por "+(scanCurrent.unidad_index?.UnidadDescripcion?.MSEHL || "")}</Text>}
                                            <HStack spacing={4} style={{width: '80%', flexWrap: 'nowrap'}}>
                                                <Text style={styles.title2}>Producto:</Text>
                                                <Text style={styles.subtitle}>{scanCurrent.Producto.MAKTG}</Text>
                                            </HStack>
                                            <Text style={styles.subtitle}>{scanCurrent.Producto.MATNR}</Text>
                                        </VStack>
                                        <Stack w={"35%"}>
                                            <ImagesAsync ipSelect={props.ipSelect} imageCode={scanCurrent.MATNR} token={props.token.token}/>
                                        </Stack>
                                    </HStack>

                                    <HStack style={{justifyContent: 'space-between', alignItems: 'flex-end'}}>
                                        <Text style={styles.title1}>{getCantUnidades(scanCurrent)}</Text>
                                        {scanCurrent.ubicaciones.length &&
                                        <VStack style={{ alignItems: 'flex-end'}}>
                                                <Text style={[styles.small2]}>Ubicación:</Text>
                                                <SelectInput
                                                searchable={true}
                                                data={scanCurrent.ubicaciones}
                                                value={rackSel}
                                                setValue={setRackSel}
                                                title="Ubicación"
                                                buttonStyle={{minWidth: 120, height: 'auto'}}
                                                titleStyle={{fontSize: 11}}
                                            />
                                        </VStack>}
                                    </HStack>
                                    <HStack spacing={5} mt={0} style={{justifyContent: 'space-between'}}>
                                        {scanCurrent.CHARG && 
                                        <VStack style={{ alignSelf: 'center'}}>
                                                <Text style={[styles.small2, {fontWeight: 'bold'}]}>Lotes:</Text>
                                                <SelectInput
                                                searchable={false}
                                                data={scanCurrent.lotes}
                                                value={0}
                                                setValue={() => console.log("Selecciona lote")}
                                                title="Lotes"
                                                buttonStyle={{minWidth: 120}}
                                            />
                                        </VStack>}
                                        <VStack mt={-3} spacing={2} style={{justifyContent: 'flex-end'}}>
                                            <HStack m={0} spacing={1} style={styles.cantText}>
                                                <Text style={styles.small3}>Cant. Requerida:</Text>
                                                <Text style={styles.title2}>{scanCurrent.CANTP}</Text>
                                            </HStack>
                                            <HStack m={0} spacing={1} style={styles.cantText}>
                                                <Text style={styles.small3}>Cant. Disp Máx:</Text>
                                                <Text style={styles.title2}>{scanCurrent.maxQuantityLote ? scanCurrent.maxQuantityLote[0]:scanCurrent.maxQuantity}</Text>
                                            </HStack>
                                            <HStack m={0} spacing={1} style={styles.cantText}>
                                                <Text style={styles.small3}>Cant. Disp. Ubi:</Text>
                                                <Text style={styles.title2}>{rackSel !== null ? scanCurrent.ubicaciones[rackSel]?.MAX:0}</Text>
                                            </HStack>
                                            <TextInput
                                                ref={inputCant1}
                                                value={scanCurrent.TCANT?.toString()} 
                                                onChangeText={(text) => changeQuantity(text)} 
                                                //onEndEditing={(e) => changeQuantityPost(e.nativeEvent.text)}
                                                numeric
                                                keyboardType="numeric"
                                                editable={((scanCurrent.maxQuantityLote && scanCurrent.maxQuantityLote[0] > 0) || scanCurrent.maxQuantity > 0) && rackSel !== null ? true:false}
                                                placeholder="10"
                                                textAlign={'center'}
                                                inputStyle={{marginTop: -18}}
                                                inputContainerStyle={{
                                                    height: 30,
                                                    padding: 10}}
                                                    style={{alignItems: 'flex-end', width: 145, flexWrap: 'nowrap'}}
                                                maxLength={10}
                                                />
                                        </VStack>
                                    </HStack>
                                    <Button color="secondary" 
                                        loading={loadingSave}
                                        title="Cargar"
                                        trailing={props => <MaterialCommunityIcons name="send" {...props} size={20}/>} 
                                        style={{marginTop: 5}} 
                                        onPress={() => saveProduct(JSON.parse(JSON.stringify(scanCurrent)), true)} 
                                        disabled={loadingSave || !scanCurrent.TCANT || rackSel === null}/>
                                </Stack>
                                :''}
                            </Box>
                        </View>:
                        <View>
                            <VStack m={10}>
                                <Text style={{textAlign: 'justify', fontSize: 12}}>Para comenzar el escaneo presiona el siguiente botón. Recuerda que al comenzar se debe culminar en el menor tiempo posible para ir mejorando tus estadisticas.</Text>
                                <Button title="Iniciar Escaneo" color={Global.colorMundoTotal} onPress={() => !loading && pedido.length ? iniciarEscaneo():''} disabled={loading || !pedido.length ? true:false}/>
                            </VStack>
                        </View>
                    :''}
                    {loading ? <ActivityIndicator />:''}
                    <Stack style={styles.escaneados}>
                        <HStack spacing={2} style={{justifyContent: 'space-between', alignItems: 'center'}}>
                            <Text style={styles.title2}>Productos escaneados ({trasladoItems?.filter(f => f.TCANT > 0).length}):</Text>
                            {props.dataUser.USSCO.indexOf('TRASLADOS_UPD') !== -1 && traslado.TRSTS === 1 && trasladoItems.length && <Button compact={true} title="Finalizar" onPress={finalizarTraslado} disabled={loading || loadingSave} loading={loading || loadingSave}/>}
                        </HStack>
                        <ListaPerform 
                            items={cronometro.FINIC ? trasladoItems:[]} 
                            renderItems={memoRows} 
                            heightRemove={traslado.TRSTS === 1 ? ((scanCurrent && scanCurrent.MATNR ) ? 125:280):160}
                            />
                    </Stack>
                    <View style={{ width: 200, height: 10 }}></View>
                </ScrollView>
            </Stack>
        </Provider>
    )
}

export default ScaneoPedido;

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
    small3: {
        fontSize: 12,
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
        padding: 3,
        width: '99%',
        flexWrap: 'nowrap',
        //maxWidth: 400
    },
    escaneados: {
        marginTop: 10,
        zIndex: 9,
    },
    items: {
        justifyContent: 'space-between', 
        marginBottom: 1, 
        borderBottomWidth: 1
    },
    title_small: {
        zIndex: 9,
        fontSize: 11,
        fontWeight: '500'
    },
    quantity: {
        fontSize: 18,
        fontWeight: 'bold',
        alignSelf: 'center'
    },
    lote: {
        fontSize: 12,
        fontWeight: 'bold'
    }, 
    cantText: {
        justifyContent: 'space-between',
        alignItems: 'flex-end', 
        width: 'auto', 
        flexWrap: 'nowrap'
    }
});

const Crono = ({cronometro}) => {
    const [diff, setDiff] = useState('');

    useEffect(() => {
        if(cronometro.FINIC && !cronometro.FFEND) {
            let interval = setInterval(() => setDiff(timeDiff(cronometro.FINIC)), 1000);
            return () => {
                clearInterval(interval);
            }
        }
    }, [cronometro]);

    return <Text style={[styles.subtitle]}>{cronometro.FINIC ? "Tiempo escaneo: "+diff:""}</Text>
};

function timeDiff(timeStart) {
    if(!timeStart) return '';
    let dateNow = new Date();

    let seconds = Math.floor((dateNow - (new Date(timeStart.replace("Z",""))))/1000);
    let minutes = Math.floor(seconds/60);
    let hours = Math.floor(minutes/60);
    let days = Math.floor(hours/24);

    hours = hours-(days*24);
    minutes = minutes-(days*24*60)-(hours*60);
    seconds = seconds-(days*24*60*60)-(hours*60*60)-(minutes*60);

    return (days > 0 ? days+"d ":'')+hours+"h "+minutes+"m "+seconds+"s";
}

function getPrural(texto) {
    switch(texto) {
        case 'Par':
            return 'Pares'
        case 'Bulto':
            return 'Bultos'
        case 'Pieza':
            return 'Piezas'
        case 'Unidad':
            return 'Unidades'
        case 'Caja':
            return 'Cajas'
        case 'Metro':
            return 'Metros'
        default: 
            return texto.split(" ")[0]
    }
}
function getCantUnidades(producto) {
    let cantidad = parseInt(producto.TCANT);
    let paquete = Math.floor(cantidad/producto.unidad_index.UMREZ);
    let unidad = cantidad - (paquete*producto.unidad_index.UMREZ);
    if(!cantidad) return "";

    if(producto.noBase) {
        return (paquete == 0 || paquete > 1 ? getPrural(producto.unidad_index.UnidadDescripcion.MSEHL):producto.unidad_index.UnidadDescripcion.MSEHL.split(" ")[0])+": "+paquete+"\n"
            +(unidad == 0 || unidad > 1 ? getPrural(producto.UnidadBase.UnidadDescripcion.MSEHL):producto.UnidadBase.UnidadDescripcion.MSEHL.split(" ")[0])+": "+unidad;
    }
    return (cantidad == 0 || cantidad > 1 ? getPrural(producto.UnidadBase.UnidadDescripcion.MSEHL):producto.UnidadBase.UnidadDescripcion.MSEHL.split(" ")[0])+": "+cantidad;
}