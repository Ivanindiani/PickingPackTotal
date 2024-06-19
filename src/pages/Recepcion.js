import { ActivityIndicator, Box, Button, HStack, IconButton, ListItem, Provider, Stack, Text, TextInput, VStack } from "@react-native-material/core";
import { useEffect, useState } from "react";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, ToastAndroid, View } from "react-native";
import fetchIvan from "../components/_fetch";
import Entypo from "react-native-vector-icons/Entypo";
import Feather from "react-native-vector-icons/Feather";
import AntDesign from "react-native-vector-icons/AntDesign";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import SelectInput from "../components/_virtualSelect";
const Global = require("../../app.json");

const statusColor = {
    CREADO: 'yellow',
    RECIBIDO: 'lightgreen',
    CONFIRMADO: 'green',
    REENVIAR: 'orange',
    CANCELADO: 'red'
};

const Recepcion = (props) => {
    const [centroId, setCentroId] = useState(props.dataUser.Centros?.length === 1 ? props.dataUser.Centros[0].WERKS:null);
    const [centrosUser] = useState(props.dataUser.Centros?.length ? props.dataUser.Centros.reduce((prev, d) => props.dataUser.Restringe?.indexOf(d.WERKS) !== -1 ? [...prev, {label: d.NAME1, value: d.WERKS}]:prev,[]):[]);
    const [almacenes, setAlmacenes] = useState([]);
    const [almacenId, setAlmacenId] = useState(null);
    const [loading, setLoading] = useState(false);

    const [modalRif, setModalRif] = useState(false);
    const [rif_input, setRifInput] = useState('');
    const [lista, setLista] = useState([]);

    const [recepciones, setRecepciones] = useState([]);
    const [descripcion, setDescripcion] = useState('');
    const [tipoProveedor, setTiposProveedor] = useState([]);
    const [tipo_proveedor_id, setTipoProveedorID] = useState(null);
    const [grupoProveedor, setGruposProveedor] = useState([]);
    const [grupo_proveedor_id, setGrupoProveedorID] = useState(null);
    const [proveedor_id, setProveedorID] = useState('');
    const [filtrado, setFiltrado] = useState(10);
    const [showCrear, setShowCrear] = useState(false);

    useEffect(() => {
        if(props.dataUser.Centros.length === 1) {
            setCentroId(props.dataUser.Centros[0]?.WERKS);
        }
        if(centroId) {
            let almacenesAux = [];
            for(let centro of props.dataUser.Centros) {
                if(centro.WERKS == centroId) {
                    almacenesAux = centro.Almacenes?.reduce((prev, al) => [...prev, {label: al.LGOBE, value: al.LGORT}], []);
                    break;
                }
            }
            console.log(almacenesAux);
            setAlmacenes(almacenesAux);
            setAlmacenId(null);
        }
    }, [centroId]);

    useEffect(() => {
        getGruposProveedor();
    }, []);
    useEffect(() => {
        if(centroId && almacenId) {
            getRecepciones();
        } else {
            setRecepciones([])
        }
    }, [almacenId, filtrado]);

    function getGruposProveedor() {
        setLoading(true);
        fetchIvan(props.ipSelect).get('/administrative/getGruposProveedor', null, props.token.token)
        .then(({data}) => {
            console.log(data.data);
            setTiposProveedor(data.data.tipoProveedores?.reduce((prev, tp) => [...prev, {label: tp.EKOTX, value: tp.EKORG}], []) ?? []);
            setGruposProveedor(data.data.grupoProveedor?.reduce((prev, tp) => [...prev, {label: tp.EKNAM, value: tp.EKGRP}], []) ?? []);
        })
        .catch(({status, error}) => {
            console.log(status, error);
            return ToastAndroid.show(
                error?.text || error?.message || (error && typeof(error) !== 'object' && error.indexOf("request failed") !== -1 ? "Por favor chequea la conexión a internet":"Error interno, contacte a administrador"),
                ToastAndroid.SHORT
            );
        })
        .finally(() => {
            setLoading(false);
        });
    }

    function getRecepciones() {
        let datos = [
            `find={"WERKS": "${centroId}", "LGORT": "${almacenId}", "RESTS": "['CREADO','RECIBIDO', 'CONFIRMADO', 'REENVIAR']"}`,
            `orderBy=[["IDREC", "DESC"]]`,
            'articulos=1'
        ];
        if(filtrado !== -1) {
            datos.push(`limit=${filtrado}`);
        }
        setLoading(true);
        setRecepciones([]);
        fetchIvan(props.ipSelect).get('/administrative/crudRecepcion', datos.join('&'), props.token.token)
        .then(({data}) => {
            console.log(data);
            setRecepciones(data.data);
        })
        .catch(({status, error}) => {
            console.log(status, error);
            return ToastAndroid.show(
                error?.text || error?.message || (error && typeof(error) !== 'object' && error.indexOf("request failed") !== -1 ? "Por favor chequea la conexión a internet":"Error interno, contacte a administrador"),
                ToastAndroid.SHORT
            );
        })
        .finally(() => {
            setLoading(false);
        });
    }

    const getRif = () => {
        if(rif_input?.length < 3) {
            return ToastAndroid.show('Ingresa al menos 3 carácteres', ToastAndroid.SHORT);
        }
        let datos = [
            `RIF=${rif_input}`,
        ];
        setLoading(true);
        setLista([]);
        setProveedorID(null); 
        fetchIvan(props.ipSelect).get('/administrative/getProveedores', datos.join('&'), props.token.token)
        .then(({data}) => {
            console.log(data);
            if(data.data.length)
                setLista(data.data.reduce((prev, val) => [...prev, {value: val.LIFNR, label: val.Proveedor.NAME1, subLabel: "RIF: "+val.Proveedor.STCD1+"\nID: "+val.LIFNR+"\nMoneda: "+val.WAERS}], []));
            else {
                ToastAndroid.show('No hay resultados con esa búsqueda', ToastAndroid.SHORT);
            }
        })
        .catch(({status, error}) => {
            console.log(status, error);
            return ToastAndroid.show(
                error?.text || error?.message || (error && typeof(error) !== 'object' && error.indexOf("request failed") !== -1 ? "Por favor chequea la conexión a internet":"Error interno, contacte a administrador"),
                ToastAndroid.SHORT
            );
        })
        .finally(() => {
            setLoading(false);
        });
    }

    const crearRecepcion = () => {
        let datos = {
            create: {
                WERKS: centroId,
                LGORT: almacenId,
                DESCR: descripcion,
                EKORG: tipo_proveedor_id,
                EKGRP: grupo_proveedor_id,
                LIFNR: proveedor_id.padStart(10, "0"),
                RESTS: 'CREADO'
            }
        }

        setLoading(true);
        fetchIvan(props.ipSelect).post('/administrative/crudRecepcion', datos, props.token.token)
        .then(({data}) => {
            console.log("Recepcion creada: ", data.data);
            data.data.CreadoPor = {
                IDUSR: props.dataUser.IDUSR,
                USLAS: props.dataUser.USLAS,
                USNAM: props.dataUser.USNAM,
                USNAA: props.dataUser.USNAA,
            };
            data.data.ActualizadoPor = data.data.CreadoPor;
            console.log(data.data);
            setRecepciones([data.data, ...recepciones]);
            setDescripcion('');
            setGrupoProveedorID(null),
            setProveedorID('');
            setTipoProveedorID(null);
        })
        .catch(({status, error}) => {
            console.log(error);
            if(error?.message?.indexOf('FK_ZSD_RECEPCIONS_LFA1_MANDT_LIFNR') !== -1) {
                return ToastAndroid.show('Compruebe el ID del proveedor, el ingresado no existe', ToastAndroid.SHORT);
            }
            if(error?.message?.indexOf('FK_ZSD_RECEPCIONS_T024E_MANDT_EKORG') !== -1) {
                return ToastAndroid.show('Compruebe el tipo de proveedor, el ingresado no existe', ToastAndroid.SHORT);
            }
            if(error?.message?.indexOf('FK_ZSD_RECEPCIONS_T024_MANDT_EKGRP') !== -1) {
                return ToastAndroid.show('Compruebe el grupo de proveedor, el ingresado no existe', ToastAndroid.SHORT);
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

    const dropRecepcion = (name, id, anular) => {
        Alert.alert('Confirmar', `¿Deseas eliminar la recepción (${name}) realmente?\nSe eliminarán todo los artículos creados`, [
        {
          text: 'Sí, deseo eliminar',
          style: 'destructive',
          onPress: () => {
            let datos = {
                id: id,
                anular: anular,
                update: {
                    RESTS: 'CANCELADO'
                }
            };

            setLoading(true);
            fetchIvan(props.ipSelect).put('/administrative/crudRecepcion', datos, props.token.token)
            .then(({data}) => {
                console.log("Recepcion eliminado: ", data.data);
                setRecepciones(recepciones.filter(t => t.IDREC != id));
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

    const updateRecepcion = (recepcion) => {
        let auxRecepciones = JSON.parse(JSON.stringify(recepciones));
        auxRecepciones.map((t,k)=>{
            if(t.IDREC === recepcion.IDREC) {
                auxRecepciones[k] = recepcion;
            }
        });
        setRecepciones(auxRecepciones);
        console.log("Recepciones actualizados");
    }

    const mailSend = async (recepcion) => {
        Alert.alert('Confirmar', recepcion.SAP?.MAIL == 1 ?`Ya el correo ha sido enviado, sin embargo.\n¿Deseas hacer un reenvio de correo para notificar la devoluciones pendientes de esta recepción?`:`¿Deseas notificar las devoluciones pendientes de esta recepción`, [
        {
            text: 'Sí, enviar correo',
            style: 'destructive',
            onPress: () => {
            let datos = {
                IDREC: recepcion.IDREC
            };
            if(recepcion.SAP?.MAIL == 1) {
                datos.forzar = true;
            }
            setLoading(true);
            fetchIvan(props.ipSelect).post('/administrative/mailRecepcion', datos, props.token.token)
            .then(({data}) => {
                console.log("MAIL ENVIADO: ", data.data);
                ToastAndroid.show("EMAIL ENVIADO CON ÉXITO", ToastAndroid.LONG);
                //setRecepciones(recepciones.reduce((prev, rec) => rec.IDREC === recepcion.IDREC ? [...prev, {...rec, SAP: {...rec.SAP, MAIL: '1'}}]:[...prev, {...rec}]));
                getRecepciones();
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
            }
        },
        {
            text: 'No',
            style: 'cancel',
            onPress: () => console.log("cancel")
        },
        ]);
    }
    
    return (
        <Provider>
            <Stack spacing={1} style={{ margin: 5 }}>
                <View style={styles.centros}>
                    <Text style={{fontWeight: '500'}}>Sucursal: </Text>
                    <SelectInput
                        searchable={false}
                        data={centrosUser}
                        value={centroId}
                        setValue={setCentroId}
                        title="Sucursal Origen"
                        buttonStyle={{maxWidth: '70%', padding: 3}}
                    />
                    {!centrosUser.length && <Text style={{fontWeight: '500'}}>No tienes centros asignados</Text>}
                </View>
            
                {centroId && almacenes.length ?<View style={styles.centros}>
                    <Text style={{fontWeight: '500'}}>División: </Text>
                    <SelectInput
                        searchable={false}
                        data={almacenes}
                        value={almacenId}
                        setValue={setAlmacenId}
                        title="División origen"
                        buttonStyle={{maxWidth: '70%', alignSelf: 'flex-end'}}
                        disabled={!centroId ? true:false}
                    />
                </View>:''}
                
                <ScrollView nestedScrollEnabled={true}  style={styles.scrollView}>
                    {props.dataUser.USSCO.indexOf('ADMIN_RECEPCION') !== -1 &&
                    <Button style={styles.title1} title="Crear Recepción" color="white" tintColor={Global.colorMundoTotal} onPress={() => setShowCrear(!showCrear)}
                        leading={props => <MaterialCommunityIcons name={showCrear ? "menu-down":"menu-right"} {...props} size={24}/> } />}
                    {props.dataUser.USSCO.indexOf('ADMIN_RECEPCION') !== -1 && showCrear ?  
                    <Box style={styles.box}>
                        <TextInput 
                            variant="standard" 
                            placeholder="Descripción, nº factura, etc.."
                            value={descripcion}
                            onChangeText={(text) => setDescripcion(text)}
                            maxLength={50}></TextInput>
                        <HStack style={{gap: 2, maxWidth: '100%', justifyContent: 'space-between'}} ms={-7}>
                            <SelectInput
                                searchable={false}
                                data={tipoProveedor}
                                value={tipo_proveedor_id}
                                setValue={setTipoProveedorID}
                                titleStyle={{fontSize: 9}}
                                title="Tipo Proveedor"/>
                            <SelectInput
                                searchable={false}
                                data={grupoProveedor}
                                value={grupo_proveedor_id}
                                setValue={setGrupoProveedorID}
                                titleStyle={{fontSize: 9}}
                                title="Grupo Proveedor"/>
                        </HStack>
                        <HStack style={{width: '100%', justifyContent: 'space-between'}} mt={5}>
                            <TextInput 
                                variant="standard" 
                                placeholder="ID PROVEEDOR"
                                value={proveedor_id}
                                onChangeText={(text) => setProveedorID(text)}
                                onEndEditing={(e) => e.nativeEvent.text.length && setProveedorID(e.nativeEvent.text.padStart(10, "0"))}
                                maxLength={10}
                                style={{width: '70%'}}></TextInput>
                            <VStack style={{width: '25%', alignItems: 'center'}}>
                                <Text style={styles.subtitle}>Buscar por RIF</Text>
                                <Button style={{width: 54}} color={Global.colorMundoTotal} onPress={() => {
                                    setModalRif(true);
                                    setLista([]); 
                                    setProveedorID(null); 
                                    setRifInput(null);
                                }} leading={props => <Feather name="search" {...props} />}/>
                            </VStack>
                        </HStack>
                        <Button loading={loading}
                            title="Crear" 
                            color="secondary" 
                            onPress={crearRecepcion}
                            disabled={!descripcion.length || !tipo_proveedor_id || !grupo_proveedor_id || !proveedor_id?.length || loading || !almacenId}
                            style={{marginTop: 5, zIndex: -1}}/>
                    </Box>:''}
                    <Stack style={styles.scrollView}>
                        <HStack style={{justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 5}}>
                            <Text>{"Lista de recepciones\n"}</Text>
                            <SelectInput
                                data={[{label: '10', value: 10},{label: '25', value: 25},{label: '50', value: 50},{label: '100', value: 100},{label: 'Todos', value: -1}]}
                                value={filtrado}
                                setValue={setFiltrado}
                                title=""
                            />
                        </HStack>
                        {recepciones.map((recepcion, i) => 
                            <ListItem
                                key={i}
                                overline={recepcion.SAP?.NUM_ENTRADA_MERC ? "DISP. en STOCK":recepcion.RESTS}
                                title={recepcion.DESCR}
                                secondaryText={"Proveedor: "+recepcion.LIFNR+"\n"+new Date(recepcion.DATEC.replace('Z','')).toLocaleString()+
                                (recepcion.SAP?.NUM_ORDEN_COMPRA ? `\nNº Confirmación: ${recepcion.SAP?.NUM_ORDEN_COMPRA}`:"")+
                                (recepcion.SAP?.NUM_ENTRADA_MERC ? `\nNº Entrada Stock: ${recepcion.SAP?.NUM_ENTRADA_MERC}`:"")}
                                leading={<Entypo name="circle" size={24} backgroundColor={recepcion.SAP?.NUM_ENTRADA_MERC ? Global.colorMundoTotal:statusColor[recepcion.RESTS]} color={recepcion.SAP?.NUM_ENTRADA_MERC ? Global.colorMundoTotal:statusColor[recepcion.RESTS]} style={{borderRadius: 12}} />}
                                trailing={(p2) => 
                                    <View>
                                        {props.dataUser.USSCO.indexOf('ADMIN_RECEPCION') !== -1 && recepcion.RESTS === 'CREADO'? 
                                        <IconButton icon={p2=p2 => <AntDesign name="delete" {...p2}/> } onPress={() => dropRecepcion(recepcion.DESCR, recepcion.IDREC, recepcion.RESTS === 'RECIBIDO' ? true:false)}/>:''}
                                        {recepcion.SAP?.NUM_ENTRADA_MERC && daysDiff(recepcion.DATEC) <= 7 && 
                                        recepcion.RecepcionArticulos?.reduce((prev, art) => prev+art.QUAND,0) > 0 ?
                                        <IconButton disabled={loading} icon={p2=p2 => loading ? <ActivityIndicator/>:<MaterialCommunityIcons name={recepcion.SAP?.MAIL == 1 ? "email-check":"email-send"} {...p2}/> } onPress={() => mailSend(recepcion)}/>:''}
                                    </View>
                                }
                                onPress={() => props.dataUser.USSCO.indexOf('RECEPCION_FIND') !== -1  || props.dataUser.USSCO.indexOf('ADMIN_RECEPCION') !== -1
                                    ? props.navigation.navigate('Picking', {
                                        centroId: centroId,
                                        almacenId: almacenId,
                                        recepcion: recepcion,
                                        updateRecepcion: updateRecepcion
                                }):''}
                            />
                        )}
                        {!recepciones.length && <Text>No hay recepciones creadas</Text>}
                    </Stack>
                    <View style={{ width: 200, height: 80 }}></View>
                </ScrollView>
                {loading && <ActivityIndicator />}
                <View style={styles.centeredView}>
                    <Modal
                        animationType="slide"
                        transparent={true}
                        visible={modalRif}
                        onRequestClose={() => {
                            setModalRif(false);
                        }}>
                        <View style={styles.centeredView}>
                            <View style={styles.modalView} gap={20}>
                                <HStack style={{justifyContent: 'space-between', alignItems: 'flex-end'}} gap={5}>
                                    <TextInput 
                                        variant="standard" 
                                        placeholder="INGRESE RIF"
                                        value={rif_input}
                                        onChangeText={(text) => setRifInput(text)}
                                        keyboardType="numeric"
                                        maxLength={16} style={{width: '63%'}}>
                                    </TextInput>
                                    <Stack><Button title="Buscar" color="lightgray" onPress={getRif} disabled={rif_input?.length < 3}/></Stack>
                                </HStack>
                                {lista.length ?
                                <SelectInput 
                                    data={lista}
                                    value={proveedor_id || null}
                                    setValue={setProveedorID}
                                    title="Seleccione proveedor"
                                    buttonStyle={{backgroundColor: Global.colorMundoTotal}}
                                />:''}
                                <HStack style={{justifyContent: 'space-between'}}>
                                    <Button title="Cancelar" color="lightgray" onPress={() => setModalRif(false)}/>
                                    <Button title="Aceptar" color="secondary" onPress={() => setModalRif(false)}/>
                                </HStack>
                            </View>
                        </View>
                    </Modal>
                </View>
            </Stack>
        </Provider>

    )
}

function daysDiff(timeStart, timeEnd=null) {
    if(!timeStart) return '';
    let dateNow = timeEnd ? new Date(timeEnd.replace("Z","")):new Date();

    let seconds = Math.floor((dateNow - (new Date(timeStart.replace("Z",""))))/1000);
    let minutes = Math.floor(seconds/60);
    let hours = Math.floor(minutes/60);
    let days = Math.floor(hours/24);

    hours = hours-(days*24);
    minutes = minutes-(days*24*60)-(hours*60);
    seconds = seconds-(days*24*60*60)-(hours*60*60)-(minutes*60);

    console.log("DAYS ", timeStart, days);
    return days;
}

export default Recepcion;

const styles = StyleSheet.create({
    scrollView: {
        marginTop: 10,
        zIndex: 9
    }, 
    title1: {
        alignSelf: 'center',
        fontSize: 16,
        fontWeight: 'bold'
    },
    subtitle: {
        fontSize: 13,
    },
    centros: {
        width: "99%",
        //alignSelf: 'flex-end',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end'
    },
    box: {
        marginTop: 5,
        backgroundColor: "lightgrey",
        padding: 10,
        borderBottomLeftRadius: 5,
        borderBottomRightRadius: 5,
        borderTopLeftRadius: 5,
        borderTopRightRadius: 5
    },
    // MODAL
    centeredView: {
        flex: 1,
        alignItems: 'center',
        marginTop: 50,
    },
    modalView: {
        margin: 20,
        width: '80%',
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    }
})