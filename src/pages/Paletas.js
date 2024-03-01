import { useEffect, useState } from "react";
import fetchIvan from "../components/_fetch";
import { ActivityIndicator, Box, Button, HStack, IconButton, ListItem, Provider, Stack, Text } from "@react-native-material/core";
import { Alert, FlatList, Linking, ScrollView, StyleSheet, ToastAndroid, View, useWindowDimensions } from "react-native";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import MI from "react-native-vector-icons/MaterialCommunityIcons";
import AntDesign from "react-native-vector-icons/AntDesign";
import { TabBar, TabView } from "react-native-tab-view";
//import backGround from "../components/_taskBackground";
import GetLocation from "react-native-get-location";
//import foreground from "../components/_foregroundService";
//import { PermissionsAndroid } from "react-native";
const Global = require('../../app.json');

const ordenStatusColor = ['red', 'yellow', 'orange', 'lightgreen', 'green'];
const ordenStatus = ['Eliminado', 'Cargando en Origen', 'En Ruta', 'Recibiendo paquetes', 'Finalizada'];
const rutaColor = {
    "Creada": Global.colorMundoTotal,
    "En Ruta": 'yellow',
    "Entregada": 'green'
}

const Paletas = (props) => {

    const [loading, setLoading] = useState(false);
    const [Orden, setOrden] = useState(props.route.params.orden || {});

    const Centro = props.dataUser.Centros.filter((centro) => centro.WERKS === props.route.params.centroId)[0] || {};
    const Almacen = Centro.Almacenes?.filter((alm) => alm.LGORT === props.route.params.almacenId)[0] || {};

    const addPalet = () => {
        Alert.alert('Confirmar', `¿Deseas agregar una nueva paleta?`, [
            {
              text: 'Sí',
              onPress: () => {
                let datos = {
                    create: {
                        IDTRG: Orden.IDTRG
                    }
                };
    
                setLoading(true);
                fetchIvan(props.ipSelect).post('/crudPaletas', datos, props.token.token)
                .then(({data}) => {
                    console.log("Paleta creada: ", data.data);
                    let ordenProvi = JSON.parse(JSON.stringify(Orden));
                    ordenProvi.Paletas.push({...data.data, PaleticaTras: []});
                    props.route.params.setOrden(ordenProvi);
                    setOrden(ordenProvi);
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
              text: 'No',
              style: 'cancel',
            },
        ]);
    }

    const delPalet = (id) => {
        Alert.alert('Confirmar', `¿Deseas eliminar esta paleta?\n\nRecuerda que esta paleta puede contener traslados y artículos cargados.`, [
            {
              text: 'Sí',
              style: 'destructive',
              onPress: () => {
                let datos = {
                    id: id
                };
    
                setLoading(true);
                fetchIvan(props.ipSelect).delete('/crudPaletas', datos, props.token.token)
                .then(({data}) => {
                    console.log("Paleta eliminada: ", data);
                    let ordenProvi = JSON.parse(JSON.stringify(Orden));
                    ordenProvi.Paletas = ordenProvi.Paletas.filter((palet) => palet.IDPAL !== id);
                    props.route.params.setOrden(ordenProvi);
                    setOrden(ordenProvi);
                    ToastAndroid.show("Paleta eliminada con éxito, "+(data.traslados?.length || 0)+" Traslados eliminados", ToastAndroid.SHORT);
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
              text: 'No',
              style: 'cancel',
            },
        ]);
    }

    const layout = useWindowDimensions();

    const [index, setIndex] = useState(0);
    const [routes] = useState([
        { key: 'paletas', title: 'Paletas' },
        { key: 'rutas', title: 'Rutas asignadas' },
    ]);

    useEffect(() => {
        if(props.dataUser.CAMIONERO && (Orden.STSOR >= 2 && Orden.STSOR < 3)) {
            const getGPS = () => {
                GetLocation.getCurrentPosition({
                    enableHighAccuracy: false,
                    timeout: 60000,
                })
                .then(location => {
                    console.log(location, Orden.IDTRG);
                    let datos = {
                        id: Orden.IDTRG,
                        IDTRU: Orden.IDTRU,
                        update: {
                            TLATI: location.latitude,
                            TLONG: location.longitude
                        }
                    }
                    fetchIvan(props.ipSelect).put('/crudOrdenes', datos, props.token.token)
                    .then(async ({data}) => {
                        console.log("GPS_LOG", data);
                    })
                    .catch(({status, error}) => {
                        console.error("GPS_LOG", error);
                    });
                })
                .catch(error => {
                    const { code, message } = error;
                    console.warn(code, message);
                })
            }
            getGPS();
            let timerGPS = setInterval(() => {
                getGPS();
            }, 1000*60);

            return () => {
                console.log("Clear Timer");
                clearInterval(timerGPS);
            }
           /* console.log("Location start", foreground.all.is_task_running('location_conductor'))
            if(!foreground.all.is_task_running('location_conductor')) {
                console.log("iniciamos foreground")
                PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
                    {
                        title: 'Permisos de ubicación en 2do plano',
                        message:
                        'Hola necesitamos que nos permitas acceder a tu ubicación en segundo plano ',
                        buttonNeutral: 'Preguntarme Despues',
                        buttonNegative: 'Negar',
                        buttonPositive: 'Permitir',
                    },
                ).then((backgroundgranted) => {
                    
                    if (backgroundgranted === PermissionsAndroid.RESULTS.GRANTED) {
                        foreground.add_task();
                        foreground.all.start({
                            id: 1244,
                            title: "Estas en modo ruta",
                            message: "Orden: "+Orden.DCONC,
                            icon: "ic_launcher",
                            button: false,
                            button2: false,
                            buttonText: "Button",
                            button2Text: "Anther Button",
                            buttonOnPress: "cray",
                            setOnlyAlertOnce: true,
                            color: "#000000",
                            progress: {
                            max: 100,
                            curr: 50,
                            },
                        }).then((r) => {
                            console.log(r);
                        }).catch((err) => {
                            console.error(err);
                            foreground.all.remove_task('location_conductor')
                        });
                    } else {
                        console.log('no permissions to obtain location', backgroundgranted);
                    }
                }).catch((err) => {
                    console.error(err);
                    foreground.all.remove_task('location_conductor')
                });
            } else {
                foreground.all.stopAll().then((e) => console.log(e)).catch((err) => console.error(err));
                foreground.all.remove_task('location_conductor')
            }*/
        }
    }, [Orden]);

    const Paleta = () => 
        <View style={styles.view}>
            {loading && <ActivityIndicator />}
            <FlatList
                ListHeaderComponent={<HStack style={{justifyContent: 'flex-end', alignItems: 'center', padding: 1, paddingBottom: 3}}>
                    {props.dataUser.USSCO.indexOf('TRASLADOS_NEW') !== -1 && Orden.STSOR === 1 ?
                    <Button title="Agregar paleta" color="secondary" 
                        leading={p2 => <FontAwesome5 name="pallet" {...p2} size={14}/>} 
                        trailing={p2 => <HStack>
                                <FontAwesome5 name="truck-loading" {...p2} size={14}/>
                                <MI name="truck-delivery-outline" {...p2} size={16}/>
                            </HStack>
                        }
                        pressableContainerStyle={{padding: 0}}
                        onPress={addPalet}
                        uppercase={false}
                        loading={loading}
                    />:''}
                </HStack>}
                data={Orden.Paletas}
                renderItem={({item, index}) =>
                    <ListItem
                        key={index}
                        leading={<FontAwesome5 name="pallet" size={24}/>}
                        overline={"ID: "+item.IDPAL}
                        title={"Paleta "+item.IDPAL.substr(-3).padStart(3, '0')}
                        secondaryText={"Creada el: "+item.DATEC.split("T")[0]+" "+item.DATEC.split("T")[1].substring(0,5)}
                        trailing={p2 => props.dataUser.USSCO.indexOf('TRASLADOS_DEL') !== -1 && Orden.STSOR === 1 ? <IconButton icon={p2=p2 => <AntDesign name="delete" {...p2} color="red"/> } onPress={() => delPalet(item.IDPAL)}/>:''}
                        onPress={() => props.dataUser.USSCO.indexOf('TRASLADOS_FIND') !== -1 ? props.navigation.navigate(props.dataUser.CAMIONERO ? 'RecibirTraslados':'Traslados', {
                            type_tras: 'crear_tras',
                            centroId: props.route.params.centroId,
                            almacenId: props.route.params.almacenId,
                            centroName: Centro.NAME1,
                            almacenName: Almacen.LGOBE,
                            IDTRG: Orden.IDTRG,
                            IDPAL: item.IDPAL,
                            STSOR: Orden.STSOR,
                            Paletas: Orden.Paletas,
                            setPaletas: (json) => {
                                setOrden({...Orden, Paletas: json});
                                props.route.params.setOrden({...Orden, Paletas: json});
                            }
                        }):''}
                    />
                }
                ListEmptyComponent={<Text>No hay paletas aún</Text>}
            />
        </View>;
    
    const Rutas = () => 
        <View style={styles.view}>
            <FlatList
                data={Orden.Rutas}
                renderItem={({item, index}) =>
                    <ListItem
                        key={index}
                        leading={<FontAwesome5 name="route" size={24} color={rutaColor[item.DROUT]}/>}
                        title={"Destino "+item.Centro.NAME1}
                        overline={"Actualizado el: "+item.DATEU.split("T")[0]+" "+item.DATEU.split("T")[1].substring(0,5)}
                        secondaryText={item.DROUT+"\n"+item.Centro.STRAS}
                        trailing={props.dataUser.CAMIONERO && <MI name="google-maps" size={28} color="red" onPress={() => {
                            //Linking.openURL('https://www.google.com/maps/dir/10.43759598764664,-66.8640156895606/10.504786089464462,-66.91516573649994')
                            Linking.openURL(`https://www.google.com/maps/dir/Your+location/${item.Centro.TLATI},${item.Centro.TLONG}`);
                        }}/>}
                        onPress={() => changeStatusRuta(ruta, i)}
                    />
                }
                ListEmptyComponent={<Text>No hay rutas registradas</Text>}
            />
        </View>;

    const _renderScene = ({ route }) => {
        switch(route.key) {
            case 'paletas':
                return <Paleta/>;
            case 'rutas':
                return <Rutas />;
        }
    }

    const changeStatusRuta = (ruta, index) => {
        if(props.dataUser.CAMIONERO && ruta.DROUT !== 'Entregada' && Orden.STSOR < 3) {
            if(Orden.STSOR === 1) {
                return Alert.alert("Error", "Debes confirmar antes la salida de la orden y luego cliquea la ruta que deseas dirigirte.",
                [{text: "Ok"}])
            }
            Alert.alert(ruta.DROUT === 'Creada' ? 'Iniciar Ruta':'Entregar Productos', 
                ruta.DROUT === 'Creada' ? `Confirma\n\n¿Deseas iniciar la ruta a ${ruta.Centro.NAME1}?`:
                `Confirma\n\n¿Deseas dar por finalizada la ruta y que haz entregado los productos a ${ruta.Centro.NAME1}?`, [
                {
                  text: 'Sí',
                  onPress: () => {
                    let datos = {
                        id: ruta.IDRUT,
                        update: {
                            DROUT: ruta.DROUT === 'Creada' ? 'En Ruta':'Entregada'
                        }
                    };
        
                    setLoading(true);
                    fetchIvan(props.ipSelect).put('/administrative/crudRutas', datos, props.token.token)
                    .then(({data}) => {
                        console.log("Ruta actualizada: ", data);
                        let ordenProvi = JSON.parse(JSON.stringify(Orden));
                        ordenProvi.Rutas[index].DROUT = ruta.DROUT === 'Creada' ? 'En Ruta':'Entregada';
                        props.route.params.setOrden(ordenProvi);
                        setOrden(ordenProvi);
                        ToastAndroid.show(`Ruta (${ruta.Centro.NAME1}), puesta en ${ordenProvi.Rutas[index].DROUT}. Gracias por reportar ¡feliz viaje!`, ToastAndroid.SHORT);
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
                  text: 'No',
                  style: 'cancel',
                },
            ]);
        }
    }

    const storeData = async (value) => {
        try {
          const jsonValue = JSON.stringify(value);
          await AsyncStorage.setItem(Global.keyCamionero, jsonValue);
        } catch (e) {
          // saving error
        }
    };

    const salirOrden = () => {

        Alert.alert('Confirmar', `¿Deseas comenzar la salida del traslado?`, [
            {
              text: 'Sí',
              onPress: () => {
                let datos = {
                    id: Orden.IDTRG,
                    update: {
                        STSOR: 2
                    }
                };

                setLoading(true);
                fetchIvan(props.ipSelect).put('/crudOrdenes', datos, props.token.token)
                .then(async ({data}) => {
                    console.log("Orden actualizada: ", data);
                    let ordenProvi = JSON.parse(JSON.stringify(Orden));
                    ordenProvi.STSOR = 2;
                    props.route.params.setOrden(ordenProvi);
                    setOrden(ordenProvi);
                    storeData({
                        username: props.dataUser.ICARD,
                        deviceId: props.dataUser.IDDEV,
                        orderId: Orden.IDTRG
                    });
                    //await backGround.stop();
                   /* if(!backGround.isRunning()) {
                        console.log(await backGround.start(Orden.IDTRG));
                    } else {
                        await backGround.stop()
                    }*/
                    ToastAndroid.show(`La orden ha sido puesta en ruta, ahora elije la ruta que deseas dirigirte.`, ToastAndroid.LONG);
                })
                .catch(({status, error}) => {
                    console.log(error);
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

    return (
        <Provider>
            <Stack spacing={2} style={{margin: 2, flex: 1 }}>
                <Box style={[styles.box, {marginTop: -2}]}>
                    <Text style={{alignSelf: 'center', fontWeight: '600', fontSize: 12}}>Orden: {Orden.DCONC}</Text>
                    <Text style={{alignSelf: 'center', fontSize: 12}}>Centro: {Centro.NAME1}</Text>
                    <Text style={{alignSelf: 'center', fontSize: 12}}>Almacén: {Almacen.LGOBE}</Text>
                </Box>
                <Box style={styles.box}>
                    <Button variant="text" color="secondary" 
                        title={<MI name="reload" size={24}/>} style={{alignSelf: 'flex-end', position: 'absolute', zIndex: 10}}
                        onPress={() => {
                            setLoading(true);
                            props.route.params.updateOrden().then((data) => setOrden(data.filter((order) => order.IDTRG === Orden.IDTRG)[0])).finally(() => setLoading(false))
                        }}
                        disabled={loading}/>
                    <Text style={{fontSize: 12}}>{
                        "Chofer: "+Orden.Chofere?.DNAME+" "+Orden.Chofere?.DFNAM+
                        "\nVehículo: "+Orden.Camione?.BRAND+" "+Orden.Camione?.MODEL+" ("+Orden.Camione?.PLATE+")"+
                        "\nFecha: "+Orden.DATEC.split("T")[0]+" "+Orden.DATEC.split("T")[1].substring(0,5)+
                        "\nÚltima actualización: "+Orden.DATEU.split("T")[0]+" "+Orden.DATEU.split("T")[1].substring(0,5)+
                        "\nNº Paletas: "+Orden.Paletas.length
                        
                    }</Text>
                    {Orden.TLATI && Orden.TLONG ?
                    <Button title="Última Ubicación" color={Global.colorMundoTotal} variant="outlined" style={{fontSize: 13, marginTop: -10, alignSelf: 'flex-end'}}
                        trailing={<MI name="google-maps" size={24} />}
                        onPress={() => Linking.openURL(`https://www.google.com/maps/place/${Orden.TLATI},${Orden.TLONG}`)}
                        //onPress={() => console.log(`https://www.google.com/maps?q=${Orden.TLATI},${Orden.TLONG}+(${Orden.DCONC.replaceAll(' ','+')})`)}
                    />:''}
                    <Text style={styles.title1}>
                        Estado de orden: {ordenStatus[Orden.STSOR]} 
                    </Text>
                    {props.dataUser.CAMIONERO && Orden.STSOR === 1 ?
                     <Button title="Salir a ruta" color="secondary" disabled={loading} onPress={() => salirOrden()} trailing={<MI name="truck-fast" size={24}/>}/>:''}
                </Box>

                <TabView
                    navigationState={{ index, routes }}
                    renderScene={_renderScene}
                    onIndexChange={setIndex}
                    initialLayout={{ width: layout.width }}
                    renderTabBar={props => <TabBar {...props} style={{backgroundColor: Global.colorMundoTotal}}/>} // <-- add this line
                />
            </Stack>
        </Provider>
    )
}


const styles = StyleSheet.create({
    view: {
        marginTop: 2,
        zIndex: 9
    }, 
    title1: {
        alignSelf: 'center',
        fontSize: 13,
        fontWeight: 'bold'
    },
    centros: {
        width: "99%",
        //alignSelf: 'flex-end',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end'
    },
    box: {
        marginTop: 2,
        backgroundColor: "#EAEAEA",
        padding: 2,
        borderBottomLeftRadius: 5,
        borderBottomRightRadius: 5,
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10
    }
});

export default Paletas;