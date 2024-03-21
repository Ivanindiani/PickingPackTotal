import { ActivityIndicator, Button, Dialog, DialogActions, DialogContent, DialogHeader, HStack, Provider, Stack, Switch, Text, TextInput, VStack } from "@react-native-material/core";
import { useRef, useState, useEffect } from "react";
import { StyleSheet, Alert, ToastAndroid, Dimensions, View } from "react-native";
import KeyEvent from 'react-native-keyevent';
import { useCallback } from "react";
import ListaPerform from "../../components/_virtualList";
import fetchIvan from "../../components/_fetch";
import Ionicons from "react-native-vector-icons/Ionicons";
import ImagesAsync from "../../components/_imagesAsync";
const Global = require('../../../app.json');

const dimensionesScreen = Dimensions.get('screen');

const MoveProducts = (props) => {
    
    const [loading, setLoading] = useState(false);
    const [showKeyBoard, setShowKeyBoard] = useState(false);
    const [msgConexion, setMsgConex] = useState('');
    const bodega = props.bodega;
    const [moveCode, setMoveCode] = useState(null);
    const [dialogVisible, setDialogVisible] = useState(-1);

    const [findProduct, setFindProduct] = useState([]);

    const inputScan2 = useRef(null);

    const evento = (keyEvent) => { 
        if(!inputScan2.current?.isFocused()) {
            if((keyEvent.keyCode >= 520 && keyEvent.keyCode <= 523) || keyEvent.keyCode === 103 || keyEvent.keyCode === 10036) { // Nos llaman con enter
                inputScan2.current?.focus();
            }

            if(keyEvent.keyCode >= 29 && keyEvent.keyCode <= 54) { // A-Z
                if(inputScan2.current) {
                    inputScan2.current.focus();
                    inputScan2.current.setNativeProps({ text: keyEvent.pressedKey })
                }
            } else if(keyEvent.keyCode >= 7 && keyEvent.keyCode <= 16) { // 0-9
                if(inputScan2.current) {
                    inputScan2.current.focus();
                    inputScan2.current.setNativeProps({ text: keyEvent.pressedKey })
                }
            }
        }
    }

    useEffect(() => {
        let before = props.navigation.addListener('beforeRemove', (e) => {
            console.log("Mount listener info")
            if(dialogVisible > -1) {
                e.preventDefault();
                setDialogVisible(-1);
            }
        })

        return () => {
            console.log("Remove listener info");
            before();
        }
    }, [props.navigation, dialogVisible]);

    useEffect(() => { // Efecto de montura del componente
        if(props.tabActive && props.almacenId && dialogVisible === -1) {
            KeyEvent.onKeyDownListener(evento);

            return () => {
                //console.log("Remove keyboard listener");
                KeyEvent.removeKeyDownListener();
            }
        } 
    }, [props.tabActive, props.almacenId, dialogVisible]);

    useEffect(() => { // efecto para cada vez que cambian los estados de las config nos pone modo FOCUS
        if(props.tabActive) {
            setTimeout(() => {
                inputScan2.current?.focus()
            }, 200);
        }
    },[showKeyBoard, props.tabActive]);

    const codeFind = (code) => {
        let codigo = code.split(',')[0].match(/([A-Z|a-z|0-9])/g);
        codigo = codigo?.join("") || "";
        if(codigo) {
            inputScan2.current?.clear();
            inputScan2.current?.focus();
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

    const scanQR = (text) => {
        if(!text) return;
        let codigo = text.split(',')[0].match(/([0-9])/g);
        codigo = codigo?.join("") || "";
        for(let space of bodega.data) {
            if(space.IDDWA === codigo) {
                setMoveCode(codigo);
                return;
            }
        }
        Alert.alert("El código no corresponde a un identificador de Rack");
        setMoveCode("");
    }

    const getConcatItem = (item) => {
        return `${item.Bodega?.FLOOR ?? ''}-${item.Bodega?.AISLE ?? ''}-${item.Bodega?.COLUM ?? ''}-${item.Bodega?.RACKS ?? ''}-${item.Bodega?.PALET ?? ''}`;
    }
    
    const RowProducts = (item, index) => {
        return (
            <VStack 
                style={{marginTop: 5, borderWidth: 0.3, width: '99%', backgroundColor: 'lightgrey', height: 265}} 
                spacing={1}
                p={1}
                key={index}>
                <Text style={[styles.title2, {borderBottomWidth: 0.2}]} numberOfLines={1}>{item.Producto?.MAKTG}</Text>
                <HStack style={styles.row}>
                    <Text style={styles.th}>CÓDIGO MATERIAL:</Text>
                    <Text style={[styles.td, {backgroundColor: 'yellow'}]}>{item.MATNR}</Text>
                </HStack>
                <HStack style={styles.row}>
                    <Text style={styles.th}>LOTE:</Text>
                    <Text style={[styles.td, {color: 'black'}]}>{item.LOTEA || '-'}</Text>
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
                    <Text style={[styles.td, {backgroundColor: 'lightgreen', maxWidth: '30%', textAlign: 'center', fontSize: 13}]} numberOfLines={1}>{item.IDDWA} ({getConcatItem(item)})</Text>
                    {item.RESERVADOS <= 0 &&
                    <Button title="Mover" color="white" compact={true} tintColor="primary" trailing={<Ionicons name="move"/>} onPress={() => setDialogVisible(index)}/>}
                </HStack>
                <View style={styles.imagenPosition}>
                    <ImagesAsync ipSelect={props.ipSelect} imageCode={item.MATNR} token={props.token.token} imageStyle={{height: 90, width: 90}}/>
                </View>
            </VStack>
        )
    }

    const memoRows = useCallback((item, index) => RowProducts(item, index), [findProduct])

    return (
        <Provider>
            <Stack spacing={2} m={4} style={{flex: 1}}> 
                {!loading && msgConexion ? <Text style={{padding: 3, backgroundColor: 'red', color: 'white', textAlign: 'center', fontSize: 12}}>{msgConexion}</Text>:''}

                <TextInput placeholder={props.almacenId !== null ? "Pulsa y escanea o busca por nombre/código":"Selecciona el almacén"}
                    autoFocus = {true} 
                    onEndEditing={(e) => codeFind(e.nativeEvent.text) }
                    showSoftInputOnFocus={showKeyBoard}
                    ref={inputScan2}
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
                    //heightRemove={dimensionesScreen.height < 600 ? 335:380}
                    //height={186}
                    />
                {bodega.data && dialogVisible > -1 ?
                <Dialog visible={dialogVisible > -1 ? true:false} onDismiss={() => setDialogVisible(-1)} style={{zIndex: 100000, elevation: 100}}>
                    <DialogContent>
                        <Stack spacing={1} mt={4}>
                            <Text style={styles.title2}>Identificador de la nueva paleta: </Text>
                            <TextInput 
                                autoFocus={true}
                                variant="outlined"
                                keyboardType="numeric"
                                editable={!loading}
                                onEndEditing={(e) => scanQR(e.nativeEvent.text)} 
                                placeholder="Pulsa y escanea o escribe el identificador"
                                onFocus={() => setMoveCode(null)}
                                showSoftInputOnFocus={showKeyBoard}
                               />
                            <HStack style={{alignItems:'center', alignSelf: 'center'}}>
                                <Text style={styles.small2}>Activar teclado</Text>
                                <Switch value={showKeyBoard} onValueChange={() => setShowKeyBoard(!showKeyBoard)} autoFocus={false}/> 
                            </HStack>
                            {moveCode ? <VStack>
                                <HStack style={styles.row}>
                                    <Text style={styles.th}>PISO/NIVEL:</Text>
                                    <Text style={[styles.td, {color: 'black'}]}>{bodega.data.filter((a) => a.IDDWA === moveCode)[0]?.FLOOR}</Text>
                                </HStack>
                                <HStack style={styles.row}>
                                    <Text style={styles.th}>PASILLO:</Text>
                                    <Text style={[styles.td, {color: 'orange'}]}>{bodega.data.filter((a) => a.IDDWA === moveCode)[0]?.AISLE}</Text>
                                </HStack>
                                <HStack style={styles.row}>
                                    <Text style={styles.th}>COLUMNA:</Text>
                                    <Text style={[styles.td, {color: Global.colorMundoTotal}]}>{bodega.data.filter((a) => a.IDDWA === moveCode)[0]?.COLUM}</Text>
                                </HStack>
                                <HStack style={styles.row}>
                                    <Text style={styles.th}>RACK:</Text>
                                    <Text style={[styles.td, {color: 'red'}]}>{bodega.data.filter((a) => a.IDDWA === moveCode)[0]?.RACKS}</Text>
                                </HStack>
                                <HStack style={styles.row}>
                                    <Text style={styles.th}>PALETA:</Text>
                                    <Text style={[styles.td, {color: 'blue'}]}>{bodega.data.filter((a) => a.IDDWA === moveCode)[0]?.PALET}</Text>
                                </HStack>
                            </VStack>:''}
                        </Stack>
                    </DialogContent>
                    <DialogActions>
                        <Button
                            title="Confirmar"
                            compact
                            variant="text"
                            loading={loading}
                            disabled={loading || !moveCode}
                            onPress={() => {
                                if(moveCode === null) {
                                    return Alert.alert("Error", "Por favor ingresa un identificador válido");
                                }
                                let datos = {
                                    id: findProduct[dialogVisible].IDADW,
                                    update: {
                                        IDDWA: moveCode
                                    }
                                }
                                setLoading(true);
                                fetchIvan(props.ipSelect).put('/administrative/crudArtBodegas', datos, props.token.token)
                                .then(({data}) => {
                                    console.log(data);
                                    let temp = JSON.parse(JSON.stringify(findProduct));
                                    temp[dialogVisible].IDDWA = moveCode;
                                    temp[dialogVisible].Bodega = bodega.data.filter((a) => a.IDDWA === moveCode)[0];
                                    setFindProduct(temp);
                                    ToastAndroid.show("Cambios realizados éxitosamente!", ToastAndroid.SHORT);
                                    setDialogVisible(-1);
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
                            }}
                        />
                    </DialogActions>
                </Dialog>:''}
            </Stack>
        </Provider>
    )
}

const styles = StyleSheet.create({
    title2: {
        fontSize: 15,
        fontWeight: 'bold',
        padding: 4,
        alignSelf: 'center'
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
        fontSize: 15,
        width: '50%',
        fontWeight: '600',
        textAlign: 'left'
    },
    row: {
        justifyContent: 'space-between',
        width: '100%'
    },
    imagenPosition: {
        position: 'absolute',
        end: 5,
        top: 100,
    }
});

export default MoveProducts;