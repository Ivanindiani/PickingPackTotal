import { ActivityIndicator, Box, Button, Divider, HStack, IconButton, Provider, Stack, Switch, Text, TextInput, VStack } from "@react-native-material/core";
import { useCallback, useEffect, useRef, useState } from "react";
import { RefreshControl, StyleSheet, ToastAndroid, View } from "react-native";
import SelectInput from "../components/_virtualSelect";
import { ScrollView } from "react-native";
import { Alert } from "react-native";
import fetchIvan from "../components/_fetch";
import ImagesAsync from "../components/_imagesAsync";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import ListaPerform from "../components/_virtualList";

import AntDesign from "react-native-vector-icons/AntDesign";
import Ft from "react-native-vector-icons/Fontisto";
import RNBeep from "react-native-a-beep";
import KeyEvent from 'react-native-keyevent';

const Global = require('../../app.json');

var mode = {};
const ManagerProducts = (props) => {
    const centroId = props.route.params.centroId;
    const almacenId = props.route.params.almacenId;
    const recepcion = props.route.params.recepcion;
    
    const [lote, setLote] = useState(null);
    const [preProduct, setPreProduct] = useState({});
    const [productos, setProductos] = useState([]);
    const [cantidad, setCantidad] = useState(0);

    const [showKeyBoard, setShowKeyBoard] = useState(false);
    const [autosumar, setAutoSumar] = useState(true);
    const [autoinsert, setAutoInsert] = useState(true);

    const [loading, setLoading] = useState(false);
    const [loadingSave, setLoadingSave] = useState(false);
    const [msgConexion, setMsgConex] = useState('');

    const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
    const [dateLote, setDateLote] = useState(null);
    const [loteName, setLoteName] = useState(null);

    const inputScan = useRef(null);
    const inputCantidad = useRef(null);
    const otroInput1 = useRef(null);
    const otroInput2 = useRef(null);
    const scrollShow = useRef(null);

    useEffect(() => {
        if(loading) {
            setMsgConex("");
        }
    }, [loading === true]);

    useEffect(() => {
        getProductos();

        if(recepcion.RESTS === 'CREADO') {
            //console.log("Mount listerner key")
            KeyEvent.onKeyDownListener(evento);

            return () => {
                //console.log("Remove keyboard listener");
                KeyEvent.removeKeyDownListener();
            }
        }
    },[]); 
    
    // Evento alternativo para detectar el escaneo
    const evento = (keyEvent) => { 
        /*if(keyEvent.keyCode >= 520 && keyEvent.keyCode <= 523) { // Nos llaman con enter
            //if(verItems)
                setVerItems(false);
        }*/
        console.log(`Key: ${keyEvent.pressedKey}`);
        console.log(`onKeyUp keyCode: ${keyEvent.keyCode}`);
        //console.log("FOCUS?",otroInput.current?.isFocused());
        try {
            if(!inputScan.current?.isFocused() && !otroInput1.current?.isFocused() && !otroInput2.current?.isFocused() && !inputCantidad.current?.isFocused()) {
                //console.log(`onKeyUp keyCode: ${keyEvent.keyCode}`);
                //console.log(`Action: ${keyEvent.action}`);
                //console.log(`Key: ${keyEvent.pressedKey}`);
                
                if((keyEvent.keyCode >= 520 && keyEvent.keyCode <= 523) || keyEvent.keyCode === 103 || keyEvent.keyCode === 10036) { // Nos llaman con enter
                    console.log("Activamos ")
                    inputScan.current?.focus();
                    scrollShow.current?.scrollTo({y: 20, animated: true});
                }

                if(keyEvent.keyCode >= 29 && keyEvent.keyCode <= 54) { // A-Z
                    if(inputScan.current) {
                        inputScan.current.focus();
                        inputScan.current.setNativeProps({ text: keyEvent.pressedKey })
                        scrollShow.current?.scrollTo({y: 20, animated: true});
                    }
                } else if(keyEvent.keyCode >= 7 && keyEvent.keyCode <= 16) { // 0-9
                    if(inputScan.current) {
                        inputScan.current.focus();
                        inputScan.current.setNativeProps({ text: keyEvent.pressedKey })
                        scrollShow.current?.scrollTo({y: 20, animated: true});
                    }
                }
            }
        } catch(e) {
            console.log(e);
        }
    }

    useEffect(() => {// Efecto para detectar si va para atras
        let before = props.navigation.addListener('beforeRemove', (e) => {
            //console.log("Mount listener info")
            e.preventDefault();
            Alert.alert('Escaneo de productos', '¿Deseas realmente salir de la ventana de escaneo de productos?',
            [{
                text: 'No', style: 'cancel'
            },{
                text: 'Si', style: 'destructive', onPress: () => props.navigation.dispatch(e.data.action)
            }])
        });

        return () => {
            //console.log("Remove listener info");
            before();
        }
    }, [props.navigation]);

    useEffect(() => { // efecto para cada vez que cambian los estados de las config nos pone modo FOCUS
        setTimeout(() => {
            inputScan.current?.focus();
        }, 100);
    },[showKeyBoard, autosumar, autoinsert, preProduct]);

    useEffect(() => {
        setCantidad(0);
        setLoteName(null);
        if(lote) {
            let encontrar = false;
            inputCantidad.current?.setNativeProps({text: ""})
            for(let item of productos) {
                if(item.LOTEA == lote) {
                    //console.log("Encontramos el lote en la lista: ", item.quantity_usar)
                    encontrar = true;
                    inputCantidad.current?.setNativeProps({text: item.QUANT.toString()})
                    setCantidad(item.QUANT);
                    //setPreProduct(item);
                    break;
                }
            }
            mode = {
                mode: encontrar ? 'update':'insert', 
                lote: lote
            };
        } else {
            mode = {mode: mode.mode, lote: lote};
        }
    }, [lote]);

    useEffect(() => {
        if(loteName) {
            let encontrar = false;
            inputCantidad.current?.setNativeProps({text: ""});
            setCantidad(0);
            for(let item of productos) {
                if(item.LOTEA == loteName) {
                    //console.log("Encontramos el lote en la lista: ", item.quantity_usar)
                    encontrar = true;
                    inputCantidad.current?.setNativeProps({text: item.QUANT.toString()})
                    setCantidad(item.QUANT);
                    //setPreProduct(item);
                    break;
                }
            }
            mode = {
                mode: encontrar ? 'update':'insert', 
                lote: loteName
            };
        } else {
            mode = {mode: mode.mode, lote: loteName};
        }
    }, [loteName]);

    async function getProductos() {
        return new Promise((resolve, reject) =>{
            let datos = [
                `IDREC=${recepcion.IDREC}`,
                `find={"IDREC": "${recepcion.IDREC}"}`,
                `orderBy=[["DATEC", "DESC"]]`,
                `simpletData=true`
            ];
            setLoading(true);
            fetchIvan(props.ipSelect).get('/administrative/crudRecepcionItems', datos.join('&'), props.token.token)
            .then(({data}) => {
                let prods = data.data;
                for(let i=0;i < prods.length;i++) {
                    prods[i].unidad_index = prods[i].UnidadBase;
                    prods[i].noBase = false;
                }
                console.log(prods);
                setProductos(prods);
                resolve(prods);
            })
            .catch(({status, error}) => {
                console.log(status, error);
                reject(error);
                return ToastAndroid.show(
                    error?.text || error?.message || (error && typeof(error) !== 'object' && error.indexOf("request failed") !== -1 ? "Por favor chequea la conexión a internet":"Error interno, contacte a administrador"),
                    ToastAndroid.SHORT
                );
            })
            .finally(() => {
                setLoading(false);
            });
        });
    }

    const findCode = (code) => {
        let codigo = code.split(',')[0].match(/([A-Z|a-z|0-9])/g);
        codigo = codigo?.join("") || "";
        console.log("hola")
        if(codigo) {
            inputScan.current?.clear();
            if(preProduct && codigo == preProduct.unidad_index?.EAN11) {
                if(preProduct.UnidadBase.XCHPF !== 'X' && autosumar) {
                    let prod = JSON.parse(JSON.stringify(preProduct));

                    console.log("ENTRAMOS EN PREPRODUCT", mode)
                    prod.QUANT += parseInt(prod.unidad_index.UMREZ);
                    setCantidad(prod.QUANT);
                    if(!inputCantidad.current) {
                        let recursivo = () => {
                            if(!inputCantidad.current){
                                setTimeout(() => recursivo(),100);
                            } else {
                                inputCantidad.current?.setNativeProps({ text: prod.QUANT.toString() ?? '' })
                            }
                        }
                        setTimeout(() => recursivo(),100);
                    } else {
                        inputCantidad.current?.setNativeProps({ text: prod.QUANT.toString() ?? '' });
                    }
                    RNBeep.beep(true);

                    if(prod.IDREA) {
                        mode = {
                            mode: 'update',
                            lote: null
                        }
                    } else {
                        mode = {
                            mode: 'insert',
                            lote: null
                        }
                    }

                    setPreProduct(prod);
                    if(autoinsert && prod.IDREA) {
                        updateProduct(prod, prod.QUANT);
                    } else if(autoinsert && !prod.IDREA) {
                        addProduct(prod);
                    }
                }
                else if(preProduct.UnidadBase.XCHPF === 'X' && autosumar) {
                    RNBeep.PlaySysSound(RNBeep.AndroidSoundIDs.TONE_CDMA_PIP);
                }
                if(preProduct.IDREA) {
                    mode = {
                        mode: 'update',
                        lote: null
                    }
                } else {
                    mode = {
                        mode: 'insert',
                        lote: null
                    }
                }
                return;
            } else {
                setPreProduct({});
                setLote(null);
                setLoteName(null);
                setDateLote(null);
                setCantidad(1);
                console.log("Lo buscamos en la lista");
                for(let prod of productos) {
                    const unidadBase = prod.UnidadBase?.MEINS || "ST";
                    for(let und of prod.Producto.ProductosUnidads) {
                        if(und.EAN11 == codigo && prod.UCRID == props.dataUser.IDUSR) { // AHORA ES POR ID DE USUARIO
                            if(prod.UnidadBase.XCHPF === 'X') {
                                mode = {
                                    mode: 'update',
                                    lote: mode.lote
                                }
                                break;
                            }
                            console.log("Lo encontramos en la lista")
                            prod.unidad_index = und;

                            if(prod.unidad_index?.EAN11 === prod.UnidadBase.EAN11) {
                                prod.noBase = false;
                            } else {
                                prod.noBase = true;
                            }
                            
                            if(autosumar) {
                                prod.QUANT += parseInt(und.UMREZ);
                                setCantidad(prod.QUANT);
                                if(!inputCantidad.current) {
                                    setTimeout(() => inputCantidad.current.setNativeProps({ text: prod.QUANT.toString() ?? '' }),300);
                                } else {
                                    inputCantidad.current.setNativeProps({ text: prod.QUANT.toString() ?? '' });
                                }
                                RNBeep.beep(true);
                            }
                            mode = {
                                mode: 'update',
                                lote: null
                            }

                            setPreProduct(prod);
                            if(autoinsert) {
                                updateProduct(prod, prod.QUANT);
                            }
                            return;
                        }
                    }
                }
            
                setLoading(true);
                
                let datos = [
                    `code=${codigo}`,
                    `WERKS=${centroId}`,
                    `LGORT=${almacenId}`,
                    `simpleData=true`
                ];
                fetchIvan(props.ipSelect).get('/administrative/findProductScan', datos.join('&'), props.token.token)
                .then(({data}) => {
                    console.log(data);
                    let prod = data.data;
                    
                    mode = {
                        mode: 'update',
                        lote: null
                    }

                    for(let p in prod.ProductosUnidads) {
                        if(prod.ProductosUnidads[p].EAN11 == codigo) {
                            prod.unidad_index = prod.ProductosUnidads[p];
                            break;
                        }
                    }
                    if(prod.unidad_index?.EAN11 === prod.UnidadBase.EAN11) {
                        prod.noBase = false;
                    } else {
                        prod.noBase = true;
                    }

                    console.log("END FIND", prod);

                    if(prod.UnidadBase.XCHPF !== 'X') {
                        if(autosumar) {
                            setCantidad(parseInt(prod.unidad_index.UMREZ));
                            prod.QUANT = parseInt(prod.unidad_index.UMREZ);
                            let recursivo = () => {
                                if(!inputCantidad.current){
                                    setTimeout(() => recursivo(),100);
                                } else {
                                    inputCantidad.current?.setNativeProps({ text: prod.unidad_index.UMREZ.toString() ?? '' })
                                }
                            }
                            setTimeout(() => recursivo(),50);
                        }
                        setPreProduct(prod);
                        if(autoinsert) {
                            addProduct(prod);
                        }
                    } else {
                        setPreProduct(prod);
                    }
                }).catch(({status, error}) => {
                    console.log(status, error);
                    if(error && typeof(error) !== 'object' && error.indexOf("request failed") !== -1) {
                        setMsgConex("¡Ups! Parece que no hay conexión a internet");
                    }
                    RNBeep.beep(false);
                    return ToastAndroid.show(
                        error?.text || error?.message || (error && typeof(error) !== 'object' && error.indexOf("request failed") !== -1 ? "Por favor chequea la conexión a internet":"Error interno, contacte a administrador"),
                        ToastAndroid.SHORT
                    );
                })
                .finally(() => {
                    setLoading(false);
                });
            }
        }
    }

    const addProduct = (producto = preProduct) => {
        setLoading(true);
        let datos = {
                IDREC: recepcion.IDREC,
            create: {
                IDREC: recepcion.IDREC,
                MATNR: producto.MATNR,
                QUANT: producto.UnidadBase?.XCHPF === 'X' ? cantidad:producto.QUANT
            }
        };
        if(producto.UnidadBase?.XCHPF === 'X') {
            datos.create.LOTEA = lote === 'NEWLOTE' ? loteName:lote;
            datos.create.FVENC = dateLote;
        }
        fetchIvan(props.ipSelect).post('/administrative/crudRecepcionItems', datos, props.token.token)
        .then(({data}) => {
            mode = {
                mode: 'update',
                lote: mode.lote
            }
            data.data.CreadoPor = {
                IDUSR: props.dataUser.IDUSR,
                USLAS: props.dataUser.USLAS,
                USNAM: props.dataUser.USNAM,
                USNAA: props.dataUser.USNAA,
            };
            data.data.ActualizadoPor =  data.data.CreadoPor;
            console.log(data.data);
            setProductos([{Producto: producto, ...producto, ...data.data}, ...productos]);
            setPreProduct({...producto, ...data.data});

        }).catch(({status, error}) => {
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

    const changeQuantityPost = (text) => {
        console.log("Hola soy change cantidad ",text);
        
        let cant = '';
        try {
            cant = text.match(/^[0-9]*$/g)[0];
            if(cant && cant[0] === '0') 
                cant = cant.substring(1,cant.length);
        } catch {
        }

        if(!cant) {
            setCantidad(0);
            return inputCantidad.current?.setNativeProps({text: ""});
        }
        setCantidad(parseInt(cant));
    }

    const getCantUnidades = (producto, cant = cantidad) => {
        if(!cant) return "";
        let paquete = Math.floor(cant/producto.unidad_index.UMREZ);
        let unidad = (cant - (paquete*producto.unidad_index.UMREZ));
    
        if(producto.noBase) {
            return (paquete == 0 || paquete > 1 ? getPrural(producto.unidad_index?.UnidadDescripcion.MSEHL):producto.unidad_index?.UnidadDescripcion.MSEHL.split(" ")[0])+": "+paquete+"\n"
                +(unidad == 0 || unidad > 1 ? getPrural(producto.UnidadBase?.UnidadDescripcion.MSEHL):producto.UnidadBase?.UnidadDescripcion.MSEHL.split(" ")[0])+": "+unidad;
        }
        return (cant == 0 || cant > 1 ? getPrural(producto.UnidadBase?.UnidadDescripcion.MSEHL):producto.UnidadBase?.UnidadDescripcion.MSEHL.split(" ")[0])+": "+cantidad;
    }

    const selectDate = (date) => {
        let fecha = date;
        console.log(fecha)
        let fechaName = fecha.getDate().toString().padStart(2, '0')+""+(fecha.getMonth()+1).toString().padStart(2, '0')+fecha.getFullYear().toString().substr(-2);
        fecha = fecha.getFullYear().toString()+""+(fecha.getMonth()+1).toString().padStart(2, '0')+""+fecha.getDate().toString().padStart(2, '0');
        setDatePickerVisibility(false);
        setDateLote(fecha);
        let name = preProduct.MATNR.substring(0,2)+""+preProduct.MATNR.substr(-2, 2)+""+fechaName;
        console.log(name);
        for(let m in preProduct.ProdConLotes) {
            if(preProduct.ProdConLotes[m].CHARG === name) {
                return Alert.alert('Error', 'Este lote ya existe, actualiza el lote existente');
            }
        }
        setLoteName(name);
    }

    const finalizarRecepcion = async () => {
        
        Alert.alert('Confirmar', `¿Deseas confirmar la recepción (${recepcion.DESCR}) realmente?`, [
        {
          text: 'Sí, deseo completar',
          style: 'destructive',
          onPress: () => {
            getProductos()
            .then((prods) => {
                for(let prod of prods) {
                    if(parseFloat(prod.MONTO) < 0.01) {
                        return Alert.alert('Error', 'Hay artículos sin costo por favor verifique');
                    }
                    if(parseFloat(prod.QUANT) <= 0) {
                        return Alert.alert('Error', 'Hay artículos con la cantidad inválida  por favor verifique');
                    }
                    for(let prod2 of prods) {
                        if(prod.MATNR === prod2.MATNR && prod.LOTEA === prod2.LOTEA) {
                            if(prod.MONTO !== prod2.MONTO) {
                                return Alert.alert('Error', 'Hay artículos iguales con monto diferente por favor verifique');
                            }
                        }
                    }
                }
                let datos = {
                    id: recepcion.IDREC,
                    update: {
                        RESTS: 'RECIBIDO'
                    }
                };

                setLoading(true);
                fetchIvan(props.ipSelect).put('/administrative/crudRecepcion', datos, props.token.token)
                .then(({data}) => {
                    console.log("Recepcion confirmada: ", data.data);
                    setPreProduct({});
                    recepcion.RESTS = 'RECIBIDO';
                    props.route.params.updateRecepcion(recepcion);
                })
                .catch(({status, error}) => {
                    console.log(error);
                    return ToastAndroid.show(
                        error?.text || error?.message || (error && typeof(error) !== 'object' && error.indexOf("request failed") !== -1 ? "Por favor chequea la conexión a internet":"Error interno, contacte a administrador"),
                        ToastAndroid.SHORT
                    );
                })
                .finally(() => {
                    setLoading(false);
                });
            }).catch((error) => {

            })
          },
        },
        {
          text: 'No cancelar',
          style: 'cancel',
        },
        ]);
    }

    const updateProduct = (item, cantidad, monto = null) => {
        let datos = {
            id: item.IDREA,
            IDREC: recepcion.IDREC,
            update: {
                QUANT: parseInt(cantidad)
            }
        }
        
        if(monto) {
            datos.update.MONTO = parseFloat(monto);
        }
        
        setLoadingSave(true);
        console.log(datos);
        fetchIvan(props.ipSelect).put('/administrative/crudRecepcionItems', datos, props.token.token)
        .then(({data}) => {
            let prod = JSON.parse(JSON.stringify(productos));
            for(let i=0;i < prod.length;i++) {
                if(prod[i].IDREA == item.IDREA) {
                    prod[i].QUANT = parseInt(cantidad);
                    if(monto) {
                        prod[i].MONTO = parseFloat(monto);
                    }

                    prod[i].UMOID = props.dataUser.IDUSR;
                    prod[i].ActualizadoPor =  {
                        IDUSR: props.dataUser.IDUSR,
                        USLAS: props.dataUser.USLAS,
                        USNAM: props.dataUser.USNAM,
                        USNAA: props.dataUser.USNAA,
                    };
                    console.log(prod[i].MATNR, preProduct.MATNR, prod[i].LOTEA, lote)
                    if(prod[i].MATNR == preProduct.MATNR && ((prod[i].LOTEA && prod[i].LOTEA == lote) || !prod[i].LOTEA)) {
                        console.log("Se actualiza la cantidad", cantidad)
                        inputCantidad.current?.setNativeProps({text: cantidad.toString()});
                        setCantidad(parseInt(cantidad));
                        setPreProduct({...preProduct, ...prod[i]});
                    }
                    break;
                }
            }
            setProductos(prod);

            ToastAndroid.show(
                "Cantidad actualizada con éxito",
                ToastAndroid.SHORT
            );
        })
        .catch(({status, error}) => {
            //console.log(status, error);
            if(error && typeof(error) !== 'object' && error.indexOf("request failed") !== -1) {
                setMsgConex("¡Ups! Parece que no hay conexión a internet");
            }
            if(status === 406) {
                props.route.params.updateRecepcion({...recepcion, RESTS: error.status});
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
            setLoadingSave(false);
        })
    }

    const deleteItem = (name, id) => {
        Alert.alert('Confirmar', `¿Deseas eliminar la recepción (${name}) realmente?\nSe eliminarán todo los artículos creados`, [
        {
          text: 'Sí, deseo eliminar',
          style: 'destructive',
          onPress: () => {
            let datos = {
                IDREC: recepcion.IDREC,
                id: id
            };

            setLoading(true);
            fetchIvan(props.ipSelect).delete('/administrative/crudRecepcionItems', datos, props.token.token)
            .then(({data}) => {
                console.log("Recepcion eliminado: ", data.data);
                setProductos(productos.filter(t => t.IDREA != id));
                if(preProduct.IDREA == id) {
                    mode = {
                        mode: 'insert',
                        lote: mode.lote
                    };
                }
            })
            .catch(({status, error}) => {
                console.log(error);
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
        },
        ]);
    }

    const RowProducts = (item, index) => 
        <HStack
            key={index}
            spacing={4}
            style={[styles.items,((item.UCRID == props.dataUser.IDUSR && (preProduct.MATNR === item.MATNR && item.UnidadBase.XCHPF !== 'X') || 
                        (item.UnidadBase.XCHPF === 'X' && item.LOTEA == lote && preProduct.MATNR === item.MATNR)) ? {backgroundColor: 'lightgreen'}:{}), {width: '100%'}]}
        >
            <VStack w="55%">
                <Text style={styles.title3}>{item.Producto.MAKTG ?? ""}</Text>
                <Text style={[styles.subtitle, {backgroundColor: 'yellow'}]}>{item.unidad_index?.EAN11 || item.MATNR}</Text>
                {item.LOTEA && recepcion.RESTS === 'CREADO' && <Text style={styles.subtitle} color="primary">Lote: {item.LOTEA}</Text>}
                <Text style={[styles.subtitle2]}>Creado Por: {(item.CreadoPor?.USNAM ?? '')+" "+(item.CreadoPor?.USLAS ?? '')}</Text>
                {item.UCRID !== item.UMOID && <Text style={[styles.subtitle2]}>Actualizado Por: {(item.CreadoPor?.USNAM ?? '')+" "+(item.CreadoPor?.USLAS ?? '')}</Text>}
            </VStack>

            {recepcion.RESTS === 'CREADO' ? 
            <VStack w="25%" style={{alignSelf: 'flex-end'}}>
                {props.dataUser.USSCO.indexOf('ADMIN_RECEPCION') !== -1 && 
                <Text style={[styles.subtitle2]} mt={0}>Costo ({recepcion.ProveedoresFijo?.WAERS}):</Text>}
                {props.dataUser.USSCO.indexOf('ADMIN_RECEPCION') !== -1 && 
                <TextInput
                    containerStyle={{fontSize: 5}} 
                    defaultValue={item.MONTO.toString()} 
                    numeric
                    textAlign={'center'}
                    keyboardType="numeric" 
                    inputContainerStyle={{
                        width: 90,
                        height: 45,
                        margin: 0
                    }}
                    inputStyle={{paddingEnd: 0, paddingStart: 0}}
                    editable={!loadingSave}
                    pointerEvents="none"
                    onEndEditing={(e) => {
                        let cant = '';
                        try {
                            cant = e.nativeEvent.text?.match(/(^\d+(?:\.\d+)?)/g)[0];
                            if(cant && cant[0] === '0') 
                                cant = cant.substring(1,cant.length);
                        } catch {
                        }
                        console.log(cant);
                        if(!cant || parseFloat(cant) <= 0) {
                            return otroInput1.current?.setNativeProps({text: item.MONTO.toString()});
                        }
                        otroInput1.current?.setNativeProps({text: cant})
                        updateProduct(item, item.QUANT, parseFloat(cant)) 
                    }}
                    ref={otroInput1}
                    maxLength={10}
                />}
                <Text style={styles.subtitle2}>Cant.</Text>
                <TextInput
                    containerStyle={{fontSize: 5}} 
                    defaultValue={item.QUANT.toString()} 
                    numeric
                    textAlign={'center'}
                    //onChangeText={(text) => changeQuantity2(item, text)} 
                    keyboardType="numeric" 
                    inputContainerStyle={{
                        width: 90,
                        height: 45,
                        margin: 0
                    }}
                    inputStyle={{paddingEnd: 0, paddingStart: 0}}
                    editable={!loadingSave}
                    pointerEvents="none"
                    onEndEditing={(e) => {
                        let cant = '';
                        try {
                            cant = e.nativeEvent.text?.match(/^[0-9]*$/g)[0];
                            if(cant && cant[0] === '0') 
                                cant = cant.substring(1,cant.length);
                        } catch {
                        }

                        if(!cant || parseInt(cant) <= 0) {
                            return otroInput2.current?.setNativeProps({text: item.QUANT.toString()});
                        }
                        otroInput2.current?.setNativeProps({text: cant})
                        updateProduct(item, parseInt(cant)); 
                    }}
                    ref={otroInput2}
                    maxLength={10}
                    />
               {/*<Text style={styles.subtitle}>{getCantUnidades(item, item.QUANT)}</Text>*/}
            </VStack>:
            <VStack w="30%">
                <Text style={styles.subtitle2}>Costo:</Text>
                <Text style={styles.subtitle}>{item.MONTO} {recepcion.ProveedoresFijo.WAERS}</Text>
                <Text style={styles.subtitle}>Cantidad:</Text>
                <Text style={styles.quantity}>{item.QUANT}</Text>
                {item.LOTEA && <Text style={styles.subtitle}>Lote:</Text> }
                {item.LOTEA && <Text style={styles.lote}>{item.LOTEA}</Text>}
                {/* <Text style={styles.subtitle}>{getCantUnidades(item, item.QUANT)}</Text> */}
            </VStack>}
            {recepcion.RESTS === 'CREADO' && 
                <IconButton icon={p2=p2 => <AntDesign name="delete" {...p2}/> } onPress={() => deleteItem(item.MAKTG, item.IDREA)} style={{alignSelf: 'center'}}/>
            }
        </HStack>
    ;

    const memoRows = useCallback((item, index) => RowProducts(item, index), [productos, preProduct.MATNR, loadingSave, recepcion, lote])

    const memoGet = useCallback(getProductos);

    return (
        <Provider>
            {!loading && msgConexion ? <Text style={{padding: 3, backgroundColor: 'red', color: 'white', textAlign: 'center', fontSize: 12}}>{msgConexion}</Text>:''}
            <ScrollView ref={scrollShow} nestedScrollEnabled={true} refreshControl={<RefreshControl refreshing={false} onRefresh={()=> memoGet(true)}/>}>
                <VStack>
                    <Text style={styles.title2}>{recepcion.DESCR}</Text>
                    {recepcion.RESTS === 'CREADO' ? 
                    <View> 
                        <VStack spacing={-8}>
                            <TextInput placeholder="Pulsa y escanea o escribe manualmente" 
                                autoFocus = {true} 
                                onEndEditing={(e) => findCode(e.nativeEvent.text) }
                                showSoftInputOnFocus={showKeyBoard}
                                ref={inputScan}
                                maxLength={18}
                                onFocus={() => inputScan.current?.clear()}
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
                        {preProduct.MATNR ?
                            <HStack>
                                <VStack style={[styles.row, {alignItems: 'flex-start', width: '65%'}]}>
                                    <Text style={styles.small2}>{preProduct.MAKTG || preProduct.Producto.MAKTG} </Text>
                                    <Text style={[styles.small2, {backgroundColor: 'yellow'}]}>{preProduct.MATNR} </Text>
                                    <HStack>
                                        <Text style={[styles.small2, {fontWeight: '600'}]}>Unidad escaneada: </Text>
                                        <Text style={styles.small2}>{preProduct.unidad_index?.UnidadDescripcion.MSEHL}</Text>
                                        {preProduct.noBase && <Text style={[styles.small2, {fontWeight: '600', flexWrap: 'nowrap'}]}> | Unds. por {preProduct.unidad_index?.UnidadDescripcion.MSEHL}: {preProduct.unidad_index?.UMREZ}</Text>}
                                    </HStack>
                                    <HStack>
                                        <Text style={[styles.small2, {fontWeight: '600'}]}>Unidad base: </Text>
                                        <Text style={styles.small2}>{preProduct.UnidadBase?.UnidadDescripcion.MSEHL}</Text>
                                    </HStack>
                                    <Text style={styles.title3}>{getCantUnidades(preProduct)}</Text>
                                </VStack>
                                <View style={{flex: 1}}>
                                    <ImagesAsync ipSelect={props.ipSelect} imageCode={preProduct.MATNR} token={props.token.token} style={{backgroundColor: 'black'}}/>
                                </View>
                            </HStack>:''}
                        </Box>

                        {preProduct.MATNR &&
                        <HStack style={[styles.row, {justifyContent: 'space-between'}]}>
                            {preProduct.UnidadBase.XCHPF === 'X' &&
                            <VStack style={{alignItems: 'center'}}>
                                <Text>Lote:</Text>
                                <SelectInput
                                    searchable={false}
                                    data={preProduct.ProdConLotes?.reduce((p,i) => [...p, {value: i.CHARG, label: i.CHARG}],[{value: 'NEWLOTE', label: 'NUEVO LOTE'}])}
                                    value={lote}
                                    setValue={setLote}
                                    title="Sin Lote"
                                    buttonStyle={{marginLeft: 5}}
                                />
                            </VStack>}
                            <VStack mt={-4} spacing={4} style={{justifyContent: 'flex-end'}}>
                                {/* <HStack m={0} spacing={2} style={{alignItems: 'flex-end', flexWrap: 'nowrap', height: 'auto'}}>
                                    <Text style={styles.small2}>Cant. Disp:</Text>
                                    <Text style={styles.title3}>{preProduct.UnidadBase.XCHPF === 'X' ? (lote && preProduct.cantidadDispLote[lote]):(preProduct.cantidadDisp < 0 ? 0:preProduct.cantidadDisp)}</Text>
                                </HStack> */}
                                <HStack m={0} spacing={2} style={{alignItems: 'flex-end', flexWrap: 'nowrap', height: 'auto'}}>
                                    <Text style={styles.small2}>Cant. Unitaria:</Text>
                                </HStack>
                                <TextInput
                                    ref={inputCantidad}
                                    //value={cantidad.toString()} 
                                    //onChangeText={(text) => changeQuantity(text)} 
                                    onEndEditing={(e) => changeQuantityPost(e.nativeEvent.text)}
                                    numeric
                                    keyboardType="numeric"
                                    //editable={((preProduct.cantidadDispLote && lote && preProduct.cantidadDispLote[lote] > 0) || preProduct.cantidadDisp > 0) ? true:false}
                                    placeholder="10"
                                    textAlign={'center'}
                                    inputStyle={{marginTop: -18}}
                                    inputContainerStyle={{
                                        height: 30,
                                        padding: 10}}
                                        style={{alignItems: 'flex-end', width: 120, flexWrap: 'nowrap'}}
                                    maxLength={10}
                                    />
                            </VStack>
                        </HStack>}
                        {preProduct.UnidadBase?.XCHPF === 'X' && lote === 'NEWLOTE' ?
                        <HStack style={[styles.row, {flexWrap: 'wrap'}]}>
                            <Text style={{position: 'absolute', top: 0, start: 2, fontSize: 11, fontWeight: 'bold', textAlign: 'center'}}>{loteName ? 'Nombre asignado: '+loteName:''}</Text>
                            <Text>Fecha Vencimiento:</Text>
                            <Text>{dateLote}</Text>
                            <IconButton icon={props => <Ft name="date" {...props} />} onPress={() => setDatePickerVisibility(true)}/> 
                        </HStack>:''
                        }

                        <Button title="Cargar" onPress={() => mode?.mode === 'update' ? updateProduct(preProduct, cantidad):addProduct()} color={Global.colorMundoTotal} loading={loading}
                            disabled={!cantidad || !Object.keys(preProduct).length || (preProduct.UnidadBase?.XCHPF === 'X' && lote === 'NEWLOTE' && !dateLote && !loteName) ? true:false} 
                            style={{marginTop: 10}}/>
                    </View>
                    :''}
                </VStack>

                {loading ? <ActivityIndicator />:''}
                <Stack style={styles.escaneados} mt={1}>
                    <HStack spacing={1} style={{justifyContent: 'space-between', alignItems: 'center'}}>
                        <Text style={styles.title2}>Prod. escaneados ({productos.length}):</Text>
                        {props.dataUser.USSCO.indexOf('ADMIN_RECEPCION') !== -1 && recepcion.RESTS === 'CREADO' && productos.length && <Button compact={true} title="Confirmar" onPress={finalizarRecepcion} disabled={loading || loadingSave} loading={loading || loadingSave}/>}
                    </HStack>
                    <ListaPerform
                        items={productos} 
                        renderItems={memoRows} 
                        heightRemove={recepcion.RESTS === 'CREADO' ? 135:160}
                        height={recepcion.RESTS === 'CREADO' ? 150:100}
                        />
                </Stack>
                <View style={{ width: 200, height: 10 }}></View>
            </ScrollView>
            <DateTimePickerModal
                locale="es-VE"
                isVisible={isDatePickerVisible}
                mode="date"
                onConfirm={selectDate}
                onCancel={() => setDatePickerVisibility(false)}
                minimumDate={new Date()}
            />
        </Provider>
    )
}

const styles = StyleSheet.create({
    title2: {
        fontSize: 15,
        fontWeight: '600',
        padding: 5,
        alignSelf: 'center'
    },
    title3: {
        fontSize: 15,
        fontWeight: '600'
    },
    small2: {
        fontSize: 12,
    },
    row: {
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginTop: 2
    },
    th: {
        fontSize: 14,
        //borderWidth: 0.2,
        width: '40%',
        fontWeight: '500',
        textAlign: 'right'
    },
    td: {
        fontFamily: 'Cochin',
        fontSize: 17,
        width: '50%',
        fontWeight: '600',
        textAlign: 'left'
    },
    box1: {
        justifyContent: 'space-between',
        padding: 5,
        marginLeft: 5,
        marginEnd: 5,
        backgroundColor: 'lightgrey'
    },
    items: {
        justifyContent: 'space-between', 
        marginBottom: 1, 
        borderBottomWidth: 1
    },
    title3: {
        zIndex: 9,
        fontSize: 14,
        fontWeight: '500'
    },
    subtitle: {
        fontSize: 13,
    },
    subtitle2: {
        fontSize: 11,
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

export default ManagerProducts;