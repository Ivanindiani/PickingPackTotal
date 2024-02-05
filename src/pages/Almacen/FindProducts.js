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
    
    const [loading, setLoading] = useState(false);
    const [showKeyBoard, setShowKeyBoard] = useState(false);
    const [msgConexion, setMsgConex] = useState('');

    const [findProduct, setFindProduct] = useState([]);

    const inputScan = useRef(null);

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
                    ToastAndroid.SHORT
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
                        ToastAndroid.show("Producto eliminado con éxito", ToastAndroid.SHORT);
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
                },
            },
            {
              text: 'No',
              style: 'cancel',
            },
        ]);
    }

    const getConcatItem = (item) => {
        return `${item.Bodega?.FLOOR ?? ''}${item.Bodega?.AISLE ?? ''}${item.Bodega?.COLUM ?? ''}${item.Bodega?.RACKS ?? ''}${item.Bodega?.PALET ?? ''}`;
    }

    const RowProducts = (item, index) => {
        return (
            <VStack 
                style={{marginTop: 5, borderWidth: 0.3, width: '99%', backgroundColor: 'lightgrey', height: 290}} 
                spacing={1}
                p={2}
                key={index}>
                <Text style={[styles.title2, {borderBottomWidth: 0.2}]}>{item.Producto?.MAKTG}</Text>
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
                    <Text style={styles.th}>PISO/NIVEL:</Text>
                    <Text style={[styles.td, {color: 'black'}]}>{item.Bodega?.FLOOR}</Text>
                </HStack>
                <HStack style={styles.row}>
                    <Text style={styles.th}>PASILLO:</Text>
                    <Text style={[styles.td, {color: 'orange'}]}>{item.Bodega?.AISLE}</Text>
                </HStack>
                <HStack style={styles.row}>
                    <Text style={styles.th}>COLUMNA:</Text>
                    <Text style={[styles.td, {color: Global.colorMundoTotal}]}>{item.Bodega?.COLUM}</Text>
                </HStack>
                <HStack style={styles.row}>
                    <Text style={styles.th}>RACK:</Text>
                    <Text style={[styles.td, {color: 'red'}]}>{item.Bodega?.RACKS}</Text>
                </HStack>
                <HStack style={styles.row}>
                    <Text style={styles.th}>PALETA:</Text>
                    <Text style={[styles.td, {color: 'blue'}]}>{item.Bodega?.PALET}</Text>
                </HStack>
                <HStack style={[styles.row, {alignItems: 'center'}]}>
                    <Text style={styles.th}>IDENTIFICACIÓN:</Text>
                    <Text style={[styles.td, {backgroundColor: 'lightgreen', maxWidth: '30%', textAlign: 'center'}]}>{item.IDDWA} ({getConcatItem(item)})</Text>
                    {props.dataUser.USSCO.indexOf('DEL_ARTBODEGA') !== -1 ?
                    <Button color="white" title={<AntDesign name="delete" color="red" size={20}/>} onPress={() => borrarItem(item)}/>
                    :''}
                </HStack>
                <View style={styles.imagenPosition}>
                    <ImagesAsync ipSelect={props.ipSelect} imageCode={item.MATNR} token={props.token.token} style={{backgroundColor: 'black'}}/>
                </View>
            </VStack>
        )
    }
    const memoRows = useCallback((item, index) => RowProducts(item, index), [findProduct])

    return (
        <Provider>
            <Stack spacing={2} m={4}> 
            
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
                    heightRemove={dimensionesScreen.height < 600 ? 330:375}
                    height={190}
                    />
            </Stack>
        </Provider>
    )
}

const styles = StyleSheet.create({
    title2: {
        fontSize: 17,
        fontWeight: 'bold',
        padding: 4,
        alignSelf: 'center'
    },
    small2: {
        fontSize: 11,
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
    row: {
        justifyContent: 'space-between',
        width: '100%'
    },
    imagenPosition: {
        flex: 1,
        position: 'fixed',
        start: 100,
        bottom: 150
    }
});

export default FindProducts;