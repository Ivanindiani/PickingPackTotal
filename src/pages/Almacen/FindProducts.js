import { ActivityIndicator, Button, HStack, Provider, Stack, Switch, Text, TextInput, VStack } from "@react-native-material/core";
import { useRef, useState, useEffect } from "react";
import { StyleSheet, Alert, ToastAndroid, Dimensions, View } from "react-native";
import KeyEvent from 'react-native-keyevent';
import { useCallback } from "react";
import ListaPerform from "../../components/_virtualList";
import fetchIvan from "../../components/_fetch";
import AntDesign from "react-native-vector-icons/AntDesign";
import ImagesAsync from "../../components/_imagesAsync";
const Global = require('../../../app.json');

const dimensionesScreen = Dimensions.get('screen');
const FindProducts = (props) => {
    
    const bodega = props.bodega;
    const [loading, setLoading] = useState(false);
    const [showKeyBoard, setShowKeyBoard] = useState(false);
    const [msgConexion, setMsgConex] = useState('');

    const [findProduct, setFindProduct] = useState([]);

    const inputScan = useRef(null);

    useEffect(() => {
        setFindProduct([]);
    }, [props.almacenId]);

    const evento = (keyEvent) => { 
        if(!inputScan.current?.isFocused()) {
            if((keyEvent.keyCode >= 520 && keyEvent.keyCode <= 523) || keyEvent.keyCode === 103 || keyEvent.keyCode === 10036) { // Nos llaman con enter
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
        if(props.tabActive && props.almacenId) {
            KeyEvent.onKeyDownListener(evento);

            return () => {
                //console.log("Remove keyboard listener");
                KeyEvent.removeKeyDownListener();
            }
        } 
    }, [props.tabActive, props.almacenId]);

    useEffect(() => { // efecto para cada vez que cambian los estados de las config nos pone modo FOCUS
        if(props.tabActive) {
            setTimeout(() => {
                inputScan.current?.focus()
            }, 200);
        }
    },[showKeyBoard, props.tabActive]);

    const codeFind = (code) => {
        let codigo = code.split(',')[0].match(/([A-Z|a-z|0-9])/g);
        codigo = codigo?.join("") || "";
        if(codigo) {
            inputScan.current?.clear();
            inputScan.current?.focus();
            if(props.almacenId === null) {
                return Alert.alert("Selecciona el almácen primero");
            }
            if(codigo.length < 3) {
                return Alert.alert("El código o la búsqueda deben contener 3 caracteres como mínimo.");
            }

            setFindProduct([]);
            setLoading(true);
            let datos = [
                `WERKS=${props.centroId}`,
                `LGORT=${props.almacenId}`,
                `code=${codigo}`
            ];
            fetchIvan(props.ipSelect).get('/administrative/findArtBodega', datos.join('&'), props.token.token)
            .then(({data}) => {
                setFindProduct(data.data);
            }).catch(({status, error}) => {
                console.log(error);
                if(error && typeof(error) !== 'object' && error.indexOf("request failed") !== -1) {
                    setMsgConex("¡Ups! Parece que no hay conexión a internet");
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
    }

    const borrarItem = (item) => {
        
        Alert.alert('Confirmar', `¿Deseas eliminar el articulo ${item.Producto?.MAKTG}?`, [
            {
                text: 'Sí',
                onPress: () => {
                    setLoading(true);
                    let datos = {
                        id: item.IDADW
                    }
                    fetchIvan(props.ipSelect).delete('/administrative/crudArtBodegas', datos, props.token.token)
                    .then(({data}) => {
                        console.log(data);
                        setFindProduct(findProduct.filter((a) => a.IDADW !== item.IDADW));
                        ToastAndroid.show("Producto eliminado con éxito", ToastAndroid.LONG);
                    }).catch(({status, error}) => {
                        console.log(error);
                        if(error && typeof(error) !== 'object' && error.indexOf("request failed") !== -1) {
                            setMsgConex("¡Ups! Parece que no hay conexión a internet");
                        }
                        return ToastAndroid.show(
                            error?.text || error?.message || (error && typeof(error) !== 'object' && error.indexOf("request failed") !== -1 ? "Por favor chequea la conexión a internet":"Error interno, contacte a administrador"),
                            ToastAndroid.LONG
                        );
                    })
                    .finally(() => {
                        setLoading(false);
                    });
                },
            },
            {
              text: 'No',
              style: 'cancel',
            },
        ]);
    }

    const getConcatItem = (item) => {
        return `${item.Bodega?.FLOOR ?? ''}-${item.Bodega?.AISLE ?? ''}-${item.Bodega?.COLUM ?? ''}-${item.Bodega?.RACKS ?? ''}-${item.Bodega?.PALET ?? ''}`;
    }

    const RowProducts = (item, index) => {
        return (
            <VStack 
                style={{marginTop: 5, borderWidth: 0.3, width: '99%', backgroundColor: 'lightgrey', height: item.Bodega.BLOQU ? 'auto':265}} 
                spacing={1}
                p={2}
                key={index}>
                <Text style={[styles.title2, {borderBottomWidth: 0.2}]} numberOfLines={1}>{item.Producto?.MAKTG}</Text>
                <HStack style={styles.row}>
                    <Text style={styles.th}>CÓDIGO MATERIAL:</Text>
                    <Text style={[styles.td, {backgroundColor: 'yellow'}]}>{item.MATNR}</Text>
                </HStack>
                <HStack style={styles.row}>
                    <Text style={styles.th}>LOTE:</Text>
                    <Text style={[styles.td, {color: 'black'}]}>{item.LOTEA}</Text>
                </HStack>
                <HStack style={styles.row}>
                    <Text style={styles.th}>CANTIDAD:</Text>
                    <Text style={[styles.td, {color: 'black'}]}>{item.QUANT} Unidad{item.QUANT != 1 ? 'es':''}</Text>
                </HStack>
                <HStack style={styles.row}>
                    <Text style={styles.th}>RESERVADOS:</Text>
                    <Text style={[styles.td, {color: 'red'}]} numberOfLines={1}>{item.RESERVADOS ?? 0} Unidad{item.RESERVADOS != 1 ? 'es':''}</Text>
                </HStack>
                <HStack style={styles.row}>
                    <Text style={styles.th}>{bodega.extra?.Nombres?.FLNAM || "PISO/NIVEL"}:</Text>
                    <Text style={[styles.td, {color: bodega.extra.Niveles[item.Bodega?.FLOOR]?.Color?.HCODE ?? 'black'}]}>{item.Bodega?.FLOOR}</Text>
                </HStack>
                <HStack style={styles.row}>
                    <Text style={styles.th}>{bodega.extra?.Nombres?.AINAM || "PASILLO"}:</Text>
                    <Text style={[styles.td, {color: bodega.extra.Niveles[item.Bodega?.FLOOR].Pasillos[item.Bodega?.AISLE]?.Color?.HCODE ?? 'black'}]}>{item.Bodega?.AISLE}</Text>
                </HStack>
                <HStack style={styles.row}>
                    <Text style={styles.th}>{bodega.extra?.Nombres?.CONAM || "COLUMNA"}:</Text>
                    <Text style={[styles.td]}>{item.Bodega?.COLUM}</Text>
                </HStack>
                <HStack style={styles.row}>
                    <Text style={styles.th}>{bodega.extra?.Nombres?.RANAM || "RACK"}:</Text>
                    <Text style={[styles.td]}>{item.Bodega?.RACKS}</Text>
                </HStack>
                <HStack style={styles.row}>
                    <Text style={styles.th}>{bodega.extra?.Nombres?.PANAM || "PALETA"}:</Text>
                    <Text style={[styles.td]}>{item.Bodega?.PALET}</Text>
                </HStack>
                {item.Bodega?.BLOQU && 
                <VStack style={[styles.row, {alignItems: 'center'}]}>
                    <Text style={[styles.th, {color: 'red', textAlign: 'center', width: '100%'}]}>¡Ubicación BLOQUEADA!</Text>
                    <Text style={[styles.td, {fontSize: 10.5, textAlign: 'justify', width: '100%'}]} numberOfLines={5}>{item.Bodega?.COMEB}</Text>
                </VStack>}
                <HStack style={[styles.row, {alignItems: 'center', justifyContent: 'space-between', left: -16}]}>
                    <Text style={styles.th}>ID:</Text>
                    <Text style={[styles.td, {backgroundColor: 'lightgreen', width: 'auto', maxWidth: '45%', textAlign: 'center', fontSize: 12}]} numberOfLines={1}>{item.IDDWA} ({getConcatItem(item)})</Text>
                    {props.dataUser.USSCO.split(',').indexOf('DEL_ARTBODEGA') !== -1 && !item.RESERVADOS ?
                    <Button color="white" title={<AntDesign name="delete" color="red" size={20}/>} onPress={() => borrarItem(item)}/>
                    :''}
                </HStack>
                <View style={styles.imagenPosition}>
                    <ImagesAsync ipSelect={props.ipSelect} imageCode={item.MATNR} token={props.token.token} imageStyle={{height: 90, width: 90}} msg={false}/>
                </View>
            </VStack>
        )
    }
    const memoRows = useCallback((item, index) => RowProducts(item, index), [findProduct])

    return (
        <Stack spacing={2} m={4} style={{flex: 1}}> 
        
            {!loading && msgConexion ? <Text style={{padding: 3, backgroundColor: 'red', color: 'white', textAlign: 'center', fontSize: 12}}>{msgConexion}</Text>:''}

            <TextInput placeholder={props.almacenId !== null ? "Pulsa y escanea o busca por nombre/código":"Selecciona el almacén"}
                autoFocus = {true} 
                onEndEditing={(e) => codeFind(e.nativeEvent.text) }
                showSoftInputOnFocus={showKeyBoard}
                ref={inputScan}
                //editable={props.almacenId ? true:false}
            />

            <HStack style={{alignItems:'center', alignSelf: 'center'}}>
                <Text style={styles.small2}>Activar teclado</Text>
                <Switch value={showKeyBoard} onValueChange={() => setShowKeyBoard(!showKeyBoard)} autoFocus={false}/> 
            </HStack>

            {loading && <ActivityIndicator />}
                
            <ListaPerform
                items={findProduct} 
                renderItems={memoRows} 
                //heightRemove={dimensionesScreen.height < 600 ? 330:375}
                //height={190}
                />
        </Stack>
    )
}

const styles = StyleSheet.create({
    title2: {
        fontSize: 15,
        fontWeight: 'bold',
        padding: 4,
        alignSelf: 'center',
        textAlign: 'justify'
    },
    small2: {
        fontSize: 11,
    },
    th: {
        fontSize: 12,
        //borderWidth: 0.2,
        width: '40%',
        fontWeight: '500',
        textAlign: 'right'
    },
    td: {
        fontFamily: 'Cochin',
        fontSize: 14,
        width: '50%',
        fontWeight: '600',
        textAlign: 'left'
    },
    row: {
        justifyContent: 'space-around',
        width: '100%'
    },
    imagenPosition: {
        position: 'absolute',
        end: 5,
        top: 100,
    }
});

export default FindProducts;