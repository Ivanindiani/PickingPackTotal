import {Sumar, Restar, Multiplicar, Dividir} from "../components/_globals";
import { useEffect, useMemo, useState } from "react";
import fetchIvan from "../components/_fetch";
import { ActivityIndicator, Box, Button, Dialog, DialogActions, DialogContent, 
        DialogHeader, HStack, IconButton, ListItem, Provider, Stack, Switch, Text, TextInput, VStack } from "@react-native-material/core";
import { Alert, FlatList, Linking, StyleSheet, ToastAndroid, View, useWindowDimensions } from "react-native";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import MI from "react-native-vector-icons/MaterialCommunityIcons";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import AntDesign from "react-native-vector-icons/AntDesign";
import { TabBar, TabView } from "react-native-tab-view";
//import backGround from "../components/_taskBackground";
import GetLocation from "react-native-get-location";
//import foreground from "../components/_foregroundService";
//import { PermissionsAndroid } from "react-native";
import SelectInput from "../components/_virtualSelect";
import { PieChart } from "react-native-gifted-charts";

const Global = require('../../app.json');

const ordenStatusColor = ['red', 'yellow', 'orange', 'lightgreen', 'green'];
const ordenStatus = ['Eliminado', 'Cargando en Origen', 'En Ruta', 'Recibiendo paquetes', 'Finalizada'];
const rutaColor = {
    "Creada": Global.colorMundoTotal,
    "En Ruta": 'yellow',
    "Entregada": 'green'
}

const Rutas = ({dataUser, Orden, changeStatusRuta}) => {
    const [location, setLocation] = useState({});

    useEffect(() => {
        let intentos = 0;
        const get = () => {
            if(intentos >= 5) return;
            GetLocation.getCurrentPosition({
                enableHighAccuracy: false,
                timeout: 9000,
            }).then(location => {
                setLocation(location);
            }).catch(error => {
                console.log(error, intentos);
                if(intentos < 5) {
                    intentos++;
                    setTimeout(() => get(),1000);
                }
            });
        }
        get();

        return () => {
            intentos = 10;
            console.log("chao");
        }
    },[]);

    const getDistance = (lat, lng) => {
        let startingLat = degreesToRadians(location.latitude);
        let startingLong = degreesToRadians(location.longitude);
        let destinationLat = degreesToRadians(lat);
        let destinationLong = degreesToRadians(lng);
        
        // Radius of the Earth in kilometers
        let radius = 6571;
        
        // Haversine equation
        let distanceInKilometers = Math.acos(Math.sin(startingLat) * Math.sin(destinationLat) +
                                    Math.cos(startingLat) * Math.cos(destinationLat) *
                                    Math.cos(startingLong - destinationLong)) * radius;
                                    
        console.log("Distancia final ", distanceInKilometers);
        return distanceInKilometers.toFixed(2)+" Km.";
    }

    return (
    <View style={styles.view}>
        <FlatList
            data={Orden?.Rutas}
            renderItem={({item, index}) =>
                <ListItem
                    key={index}
                    leading={<FontAwesome5 name="route" size={24} color={rutaColor[item.DROUT]}/>}
                    title={"Destino "+item.Traslado?.HaciaCentro?.NAME1}
                    overline={"Actualizado el: "+item.DATEU.split("T")[0]+" "+item.DATEU.split("T")[1].substring(0,5)}
                    secondaryText={`${item.DROUT}\nCiudad: ${(item.Traslado?.HaciaCentro?.CentrosDescripcion?.CITNA ?? '')}\nDirección: ${(item.Traslado?.HaciaCentro?.CentrosDescripcion?.DIRAV ?? '')}`+
                    `\nTraslado Nº: ${item.Traslado.IDTRA}`+
                    `\nDistancia: ${location.latitude ? getDistance(item.Traslado?.HaciaCentro?.CentrosDescripcion?.LATIS, item.Traslado?.HaciaCentro?.CentrosDescripcion?.LONGS):'Calculando...'}`}
                    trailing={dataUser.CAMIONERO && <MI name="google-maps" size={28} color="red" onPress={() => {
                        //Linking.openURL('https://www.google.com/maps/dir/10.43759598764664,-66.8640156895606/10.504786089464462,-66.91516573649994')
                        Linking.openURL(`https://www.google.com/maps/dir/Your+location/${item.Traslado?.HaciaCentro?.CentrosDescripcion?.LATIS},${item.Traslado?.HaciaCentro?.CentrosDescripcion?.LONGS}?hl=es&travelmode=driving`);
                    }}/>}
                    onPress={() => changeStatusRuta(item, index)}
                />
            }
            ListEmptyComponent={<Text>No hay rutas registradas</Text>}
        />
    </View>);
};

const Paletas = (props) => {
    const [loading, setLoading] = useState(false);
    const [Orden, setOrden] = useState(props.route.params.orden || {});
    const configOrden = props.route.params.configOrden;
    const [modalPallet, setModalPallet] = useState(null);
    const [inputs, setInputs] = useState({});
    const [show, setShow] = useState(true);

    /* Variables configurar paletas */
    const [dividirAncho, setDividirAncho] = useState(1);
    const [dividirAlto, setDividirAlto] = useState(1);
    const [paletaIDX, setPaletaIDX] = useState(0);
    /* Variables configurar paletas */
    const [modalTruck, setModalTruck] = useState(false);

    const Centro = props.dataUser.Centros.filter((centro) => centro.WERKS === props.route.params.centroId)[0] || {};
    const Almacen = Centro.Almacenes?.filter((alm) => alm.LGORT === props.route.params.almacenId)[0] || {};

    useEffect(() => { // Init configure more palets
        const fullRestante = (divAlto, palIDX) => {
            const contenedor = {
                X: Orden?.Container.XLONG,
                Y: Orden?.Container.YWIDT,
                Z: Orden?.Container.ZHEIG
            };
    
            const anchoMaximo = (Orden?.Container.YWIDT-(Orden?.Container.YWIDT*configOrden?.p_espacio_ancho*2));
            const altoMaximo = (Orden?.Container.ZHEIG-(Orden?.Container.ZHEIG*configOrden?.p_espacio_alto*divAlto));
    
            const paletaEstandar = !configOrden?.paletas_estandar?.length ? {
                    X: 1.2, 
                    Y: 0.8, 
                    Z: altoMaximo/divAlto,
                    W: 1000
                }:{
                    X: configOrden.paletas_estandar[palIDX].l, 
                    Y: configOrden.paletas_estandar[palIDX].a-(configOrden.paletas_estandar[palIDX].a*configOrden?.p_espacio_ancho*2), 
                    Z: !configOrden.paletas_estandar[palIDX].h_force ? altoMaximo/divAlto:configOrden.paletas_estandar[palIDX].h-(configOrden.paletas_estandar[palIDX].h*configOrden?.p_espacio_ancho*2),
                    W: configOrden.paletas_estandar[palIDX].w
                };
            
            
            const divisionesX = Math.floor(contenedor.X/paletaEstandar.X);
            const divisionesY = Math.floor(contenedor.Y/paletaEstandar.Y);
            const divisionesZ = Math.floor(contenedor.Z/paletaEstandar.Z);
            const maximasPromedio = Math.floor(divisionesX*divisionesY*divisionesZ);
            const maximasPorPeso = Math.floor(Orden?.PESO_MAX/paletaEstandar.W);
            console.log("Maximas idx", palIDX, maximasPromedio, maximasPorPeso);
            
            //return maximasPromedio < maximasPorPeso ? maximasPromedio:maximasPorPeso;
            return maximasPromedio;
        }

        let maximas = 0, maximasAux = 0; let maximaH = 1; let plidx = 0;
        for(let i=0; i < configOrden?.paletas_estandar?.length; i++) {
            if(configOrden?.paletas_estandar[i].h_force) continue;
            maximasAux = fullRestante(1, i);
            if(maximasAux > maximas) {
                plidx = i;
                maximaH = 1;
                maximas = maximasAux;
            }
            maximasAux = fullRestante(2, i);
            if(maximasAux > maximas) {
                plidx = i;
                maximaH = 2;
                maximas = maximasAux;
            }
        }
        /*maximasAux = fullRestante(1, 2);
        if(maximasAux > maximas) {
            maximaA = 1;
            maximaH = 2;
            maximas = maximasAux;
        }
        maximasAux = fullRestante(2, 2);
        if(maximasAux > maximas) {
            maximaA = 2;
            maximaH = 2;
            maximas = maximasAux;
        }
        setDividirAlto(maximaH);*/
        console.log("Idx final", plidx);
        console.log("Alto max", maximaH)
        setDividirAlto(maximaH);
        setPaletaIDX(plidx);

    }, []);

    useEffect(() => {
        let before = props.navigation.addListener('beforeRemove', (e) => {
            console.log("Mount listener info")
            if(modalPallet) {
                e.preventDefault();
                setModalPallet(null);
            }
            if(modalTruck) {
                e.preventDefault();
                setModalTruck(null);
            }
        })

        return () => {
            console.log("Remove listener info");
            before();
        }
    }, [props.navigation, modalPallet, modalTruck]);

    useEffect(() => {
        if(configOrden?.paletas_estandar?.length && configOrden?.paletas_estandar[paletaIDX].h_force) {
            if(dividirAlto === 2) 
                setDividirAlto(1);
            /*if(dividirAncho === 2) 
                setDividirAncho(1);*/
        }
    }, [paletaIDX, dividirAlto]);

    const addPalet = () => {
        Alert.alert('Confirmar', `¿Deseas agregar una nueva paleta?`, [
            {
              text: 'Sí',
              onPress: () => {
                let datos = {
                    create: {
                        IDTRG: Orden?.IDTRG
                    }
                };
    
                setLoading(true);
                fetchIvan(props.ipSelect).post('/crudPaletas', datos, props.token.token)
                .then(({data}) => {
                    console.log("Paleta creada: ", data.data);
                    data.data.PESO = 0;
                    data.data.VOLUMEN = 0;
                    let ordenProvi = JSON.parse(JSON.stringify(Orden));
                    ordenProvi.Paletas.push({...data.data, PaleticaTras: []});
                    props.route.params.setOrden(ordenProvi);
                    setOrden(ordenProvi);
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

    const delPalet = (id) => {
        Alert.alert('Confirmar', `¿Deseas eliminar esta paleta?\n\nSe eliminaran los artículos asociados a la paleta ${id.toString().substr(-3).padStart(3, '0')}.`, [
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
                    ToastAndroid.show("Paleta eliminada con éxito, "+(data.traslados?.length || 0)+" Traslados eliminados", ToastAndroid.LONG);
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

    const layout = useWindowDimensions();

    const [index, setIndex] = useState(0);
    const [routes] = useState([
        { key: 'paletas', title: 'Paletas' },
        { key: 'rutas', title: 'Rutas asignadas' },
    ]);

    useEffect(() => {
        if(props.dataUser.CAMIONERO && Orden?.STSOR == 2) {
            const getGPS = () => {
                GetLocation.getCurrentPosition({
                    enableHighAccuracy: false,
                    timeout: 60000,
                })
                .then(location => {
                    console.log(location, Orden?.IDTRG);
                    let datos = {
                        id: Orden?.IDTRG,
                        IDTRU: Orden?.IDTRU,
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
                            message: "Orden: "+Orden?.DCONC,
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

    const paletasRestantes = () => {
        const contenedor = {
            X: Orden?.Container.XLONG,
            Y: Orden?.Container.YWIDT,
            Z: Orden?.Container.ZHEIG
        };

        const anchoMaximo = (Orden?.Container.YWIDT-(Orden?.Container.YWIDT*configOrden?.p_espacio_ancho*2));
        const altoMaximo = (Orden?.Container.ZHEIG-(Orden?.Container.ZHEIG*configOrden?.p_espacio_alto*dividirAlto));

        const paletaEstandar = !configOrden?.paletas_estandar?.length ? {
                X: 1.2, 
                Y: 0.8, 
                Z: altoMaximo/dividirAlto,
                W: configOrden.paletas_estandar[paletaIDX].w
            }:{
                X: configOrden.paletas_estandar[paletaIDX].l, 
                Y: configOrden.paletas_estandar[paletaIDX].a-(configOrden.paletas_estandar[paletaIDX].a*configOrden?.p_espacio_ancho*2), 
                Z: !configOrden.paletas_estandar[paletaIDX].h_force ? altoMaximo/dividirAlto:(configOrden.paletas_estandar[paletaIDX].h-(configOrden.paletas_estandar[paletaIDX].h*configOrden?.p_espacio_ancho*2)),
                W: configOrden.paletas_estandar[paletaIDX].w
            };
        
        
        /* Esto saca el maximo en estandar sin contar las que ya metieron */
        const divisionesX = Math.floor(Dividir(contenedor.X,paletaEstandar.X));
        const divisionesY = Math.floor(Dividir(contenedor.Y,paletaEstandar.Y));
        const divisionesZ = Math.floor(Dividir(contenedor.Z,paletaEstandar.Z));
        const maximasPromedio = Math.floor(Multiplicar(Multiplicar(divisionesX,divisionesY),divisionesZ));
        const maximasPorPeso = Math.floor(Dividir(Orden?.PESO_MAX,paletaEstandar.W));
        /* Esto saca el maximo en estandar sin contar las que ya metieron */

        const volContenedorMax = contenedor.X*contenedor.Y*contenedor.Z;
        const volPaletasEstandar = paletaEstandar.X*paletaEstandar.Y*paletaEstandar.Z;
        
        // Ordenamos de mayor volumen a menor
        let paletasSort = Orden?.Paletas.sort((a, b) => {
            const X1=parseFloat(a.DISTX ?? paletaEstandar.X);
            const Y1=parseFloat(a.DISTY ?? paletaEstandar.Y);
            const Z1=parseFloat(a.DISTZ ?? paletaEstandar.Z);
            const X2=parseFloat(b.DISTX ?? paletaEstandar.X);
            const Y2=parseFloat(b.DISTY ?? paletaEstandar.Y);
            const Z2=parseFloat(b.DISTZ ?? paletaEstandar.Z);
            let volA = X1*Y1*Z1;
            let volB = X2*Y2*Z2;
            if(volA > volB) {
                return -1;
            }
        });

        let volumenPaletasFisicas = 0;

        let sumas = {
            X: 0,
            Y: 0,
            Z: 0
        };

        let contenedorSum = {
            X: contenedor.X,
            Y: anchoMaximo,
            Z: altoMaximo,
            W: 0
        }
        let primero = true;  
        let xMax = 0;
        let yMax = 0;

        for(let paleta of paletasSort) {
            const X=parseFloat(paleta.DISTX ?? paletaEstandar.X);
            const Y=parseFloat(paleta.DISTY ?? paletaEstandar.Y);
            const Z=parseFloat(paleta.DISTZ ?? paletaEstandar.Z);
            const W=parseFloat(paleta.WEIGH ?? paletaEstandar.W);
            contenedorSum.W += W;
            volumenPaletasFisicas += X*Y*Z;

            console.log(sumas);
            
            if(primero) {
                contenedorSum.X -= X;
                xMax = X;
                sumas.X += X;
                sumas.Y += Y;
                yMax = Y;
                sumas.Z += Z;
                primero = false;
            } else {
                if(X > xMax) {
                    contenedorSum.X += xMax;
                    xMax = X;
                    contenedorSum.X -= xMax;
                }
                if(sumas.Z+Z > altoMaximo) {
                    if(sumas.Y+Y > anchoMaximo) {
                        contenedorSum.X -= X;
                        xMax = X;
                        sumas.Y = Y;
                        yMax = Y;
                        sumas.Z = Z;
                        //primero = true;
                        continue;
                    } else {
                        sumas.Z = Z;
                        sumas.Y += Y;
                        if(Y > yMax) {
                            sumas.Y -= yMax;
                            yMax = Y;
                            sumas.Y += yMax;
                        }
                    }
                } else {
                    // ¿Que pasa si una paleta que viene arriba es mas ancha del contenedor?
                    if(Y > yMax) {
                        sumas.Y -= yMax;
                        yMax = Y;
                        sumas.Y += yMax;
                    }
                    sumas.Z += Z;
                }
            }
        }

        console.log("Sumas", contenedorSum, paletaEstandar);
        /* Cuadrante restante */
        const divisionesX1 = Math.floor(Dividir(contenedorSum.X,paletaEstandar.X));
        const divisionesY1 = Math.floor(Dividir(contenedor.Y,paletaEstandar.Y));
        const divisionesZ1 = Math.floor(Dividir(contenedor.Z,paletaEstandar.Z));
        const maximasPromedioRestante = Math.floor(Multiplicar(Multiplicar(divisionesX1,divisionesY1),divisionesZ1));
        console.log("Maximas en cuadro grande", maximasPromedioRestante, divisionesX1, divisionesY1, divisionesZ1);
        /* Cuadrante restante */

        /* Pedazos restante altura */
        const divisionesXZ = Math.floor(Dividir(Restar(contenedor.X,contenedorSum.X),paletaEstandar.X));
        const divisionesYZ = Math.floor(Dividir(yMax,paletaEstandar.Y));
        const divisionesZZ = Math.floor(Dividir(Restar(contenedor.Z,sumas.Z),paletaEstandar.Z));
        const maximasPromedioRestanteZ = sumas.Z > 0 ? Math.floor(Multiplicar(Multiplicar(divisionesXZ,divisionesYZ),divisionesZZ)):0;
        console.log("Maximas en cuadrito altura", maximasPromedioRestanteZ, divisionesXZ, divisionesYZ, divisionesZZ);
        /* Pedazos restante altura */

        /* Pedazos restante ancho */
        const divisionesXY = Math.floor(Dividir(Restar(contenedor.X,contenedorSum.X),paletaEstandar.X));
        const divisionesYY = Math.floor(Dividir(Restar(contenedor.Y,sumas.Y),paletaEstandar.Y));
        const divisionesZY = Math.floor(Dividir(contenedor.Z,paletaEstandar.Z));
        const maximasPromedioRestanteY = sumas.Y > 0 ? Math.floor(Multiplicar(Multiplicar(divisionesXY,divisionesYY),divisionesZY)):0;
        console.log("Maximas en cuadrito ancho", maximasPromedioRestanteY, divisionesXY, divisionesYY, divisionesZY);
        /* Pedazos restante ancho */

        const volumenRestante = volContenedorMax-volumenPaletasFisicas;
        
        //const maxRestantes = Math.floor(volumenRestante/volPaletasEstandar);
        console.log("Volumen restante", Math.floor(Dividir(volumenRestante, volPaletasEstandar)));

        const maximasPorPesoRestante = Math.floor(Dividir(Restar(Orden?.PESO_MAX,contenedorSum.W),paletaEstandar.W));

        const maxRestantes = maximasPromedioRestante+maximasPromedioRestanteZ+maximasPromedioRestanteY;

        console.log("Paletas máximas: "+maxRestantes, maximasPorPesoRestante);

        return maxRestantes;
    }

    const paletasRestantesMemo = useMemo(paletasRestantes, [Orden, dividirAlto, configOrden, paletaIDX]);

    const Paleta = () => 
        <View style={styles.view}>
            {loading && <ActivityIndicator />}
            <FlatList
                ListHeaderComponent={<HStack style={{justifyContent: 'space-between', alignItems: 'center', padding: 1, paddingBottom: 3}}>
                    <Text style={styles.small}>
                        Nº Pal restantes: {paletasRestantesMemo}{"\n"}
                        Total Paletas: {Orden?.Paletas.length}
                    </Text>
                    {props.dataUser.USSCO.indexOf('ADMIN_PALLET') !== -1 && Orden?.STSOR === 1 ?
                    <Button title="Agregar paleta" color={Global.colorMundoTotal} 
                        leading={p2 => <FontAwesome5 name="pallet" {...p2} size={14}/>} 
                        pressableContainerStyle={{padding: 0}}
                        onPress={addPalet}
                        uppercase={false}
                        loading={loading}
                    />:''}
                </HStack>}
                data={Orden?.Paletas}
                renderItem={({item, index}) =>
                    <ListItem
                        key={index}
                        leading={<FontAwesome5 name="pallet" size={24}/>}
                        overline={"ID: "+item.IDPAL}
                        title={"Paleta "+item.IDPAL.substr(-3).padStart(3, '0')}
                        secondaryText={
                            //"Nº Traslados: "+item.Traslados?.length+"\n"+
                            "Peso artículos: "+(parseFloat(item.PESO ?? 0).toFixed(2))+" kg\n"+
                            "Vol. artículos: "+(parseFloat(item.VOLUMEN??0).toFixed(2))+" m3"+
                            "\nCreada el: "+item.DATEC.split("T")[0]+" "+item.DATEC.split("T")[1].substring(0,5)+
                            (item.WEIGH ? `\nPeso reportado: ${item.WEIGH} ${item.MSEHI}`:'')+
                            (item.DISTX && item.DISTY && item.DISTZ ? `\nVol. reportado: ${(item.DISTX*item.DISTY*item.DISTZ).toFixed(2)} m3 (${item.DISTX}x${item.DISTY}x${item.DISTZ})`:'')}
                        trailing={p2 => 
                            !props.dataUser.CAMIONERO && <View>
                                {props.dataUser.USSCO.indexOf('TRASLADOS_DEL') !== -1 && props.dataUser.USSCO.indexOf('ADMIN_PALLET') !== -1 && Orden?.STSOR === 1 ? 
                                    <IconButton icon={p2=p2 => <AntDesign name="delete" {...p2} color="red"/> } onPress={() => delPalet(item.IDPAL)}/>:''}
                                {props.dataUser.USSCO.indexOf('ADMIN_PALLET') !== -1 && Orden?.STSOR === 1 ? <IconButton icon={p2=p2 => <MaterialIcons name="settings" {...p2}/> } onPress={() => {
                                    setInputs({
                                        largo: item.DISTX,
                                        ancho: item.DISTY,
                                        alto: item.DISTZ,
                                        peso: item.WEIGH,
                                        peso_medida: item.MSEHI,
                                        longitud_medida: item.DDMSE
                                    });
                                    setModalPallet(item.IDPAL);
                                }}/>:''}
                            </View>
                        }
                        onPress={() => props.dataUser.USSCO.indexOf('TRASLADOS_FIND') !== -1 ? props.navigation.navigate(props.dataUser.CAMIONERO ? 'RecibirTraslados':'Traslados', {
                            type_tras: 'crear_tras',
                            centroId: props.route.params.centroId,
                            almacenId: props.route.params.almacenId,
                            centroName: Centro.NAME1,
                            almacenName: Almacen.LGOBE,
                            planed: Orden?.PlanedRoute,
                            IDTRG: Orden?.IDTRG,
                            IDPAL: item.IDPAL,
                            STSOR: Orden?.STSOR,
                            Paleta: item,
                            Paletas: Orden?.Paletas,
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
    
    const _renderScene = ({ route }) => {
        switch(route.key) {
            case 'paletas':
                return <Paleta/>;
            case 'rutas':
                return <Rutas Orden={Orden} dataUser={props.dataUser} changeStatusRuta={changeStatusRuta}/>;
        }
    }

    const changeStatusRuta = (ruta, index) => {
        if(props.dataUser.CAMIONERO && ruta.DROUT !== 'Entregada' && Orden?.STSOR < 3) {
            if(Orden?.STSOR === 1) {
                return Alert.alert("Error", "Debes confirmar antes la salida de la orden y luego selecciona la ruta que deseas dirigirte.",
                [{text: "Ok"}])
            }
            Alert.alert(ruta.DROUT === 'Creada' ? 'Iniciar Ruta':'Entregar Productos', 
                ruta.DROUT === 'Creada' ? `Confirma\n\n¿Deseas iniciar la ruta a ${ruta.Traslado?.HaciaCentro?.NAME1}?`:
                `Confirma\n\n¿Deseas dar por finalizada la ruta y que haz entregado los productos a ${ruta.Traslado?.HaciaCentro?.NAME1}?`, [
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
                        ToastAndroid.show(`Ruta (${ruta.Traslado?.HaciaCentro?.NAME1}), puesta en ${ordenProvi.Rutas[index].DROUT}. Gracias por reportar ¡feliz viaje!`, ToastAndroid.LONG);
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
                    id: Orden?.IDTRG,
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
                        orderId: Orden?.IDTRG
                    });
                    //await backGround.stop();
                   /* if(!backGround.isRunning()) {
                        console.log(await backGround.start(Orden?.IDTRG));
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

    const getColorVolumen = (valor) => {
        if(valor <= 25) return "#d19306";
        else if(valor > 25 && valor <= 50) return "#6caf00";
        else if(valor > 50 && valor <= 80) return "#23af00";
        else if(valor > 80) return "#ad0000";
    }

    const getPeso = (Orden?.Paletas.reduce((prev, val) => prev+parseFloat(val.WEIGH ?? val.PESO ?? 0),0)/(Orden?.PESO_MAX > 0 ? Orden?.PESO_MAX:1))*100;
    const getVolumen = (Orden?.Paletas.reduce((prev, val) => prev+parseFloat(val.DISTX && val.DISTY && val.DISTZ ? (val.DISTX*val.DISTY*val.DISTZ):(val.VOLUMEN ?? 0)),0)/(Orden?.VOLUMEN_MAX > 0 ? Orden?.VOLUMEN_MAX:1))*100;

    const getColorPeso = (valor) => {
        if(valor <= 25) return "#03af00";
        else if(valor > 25 && valor <= 50) return "#84af00";
        else if(valor > 50 && valor <= 80) return "#c16b00";
        else if(valor > 80) return "#ad0000";
    }

    return (
        <Provider>
            <Stack spacing={2} style={{margin: 2}}>
                <Box style={[styles.box, {marginTop: -2}]}>
                    <HStack style={{justifyContent: 'space-between'}}>
                        <Text style={{fontSize: 12}}>Centro: {Centro.NAME1}</Text>
                        <Button color="lightgrey" tintColor={Global.colorMundoTotal} onPress={() => setShow(!show)}
                                title={props => <MI name={show ? "menu-down":"menu-right"} {...props} size={24}/> } style={{height: 25}} contentContainerStyle={{height: 25}}/>
                    </HStack>
                    <Text style={{alignSelf: 'center', fontWeight: '600', fontSize: 12}}>Orden: {Orden?.DCONC}</Text>
                </Box>
                <Box style={styles.box}>
                    {show &&
                    <VStack style={{alignSelf: 'flex-end', position: 'absolute', zIndex: 10}}>
                        <Button variant="text" color={Global.colorMundoTotal} 
                            title={<MI name="reload" size={24}/>} 
                            onPress={() => {
                                setLoading(true);
                                props.route.params.updateOrden(props.route.params.datemin, props.route.params.datemax).then((data) => setOrden(data.filter((order) => order.IDTRG === Orden?.IDTRG)[0])).finally(() => setLoading(false));
                            }}
                            disabled={loading}/>
                        <Button variant="text" color="black" 
                            title={<FontAwesome5 name="truck-loading" color={Orden?.STSOR !== 1 ? "lightgrey":"black"} size={24}/>} 
                            trailing={<MaterialIcons name="settings" color={Orden?.STSOR !== 1 ? "lightgrey":"black"} size={20} style={{marginLeft: -8}}/>} 
                            onPress={() => setModalTruck(true)}
                            disabled={Orden?.STSOR !== 1}/>
                    </VStack>}
                    {show &&
                    <VStack style={{border: 1}}>
                        <HStack style={{alignItems: 'flex-end'}}>
                            <Text style={styles.th}>Chofer: </Text>
                            <Text style={styles.td}>{Orden?.Chofere?.DNAME?.toUpperCase()+" "+(Orden?.Chofere?.DFNAM?.toUpperCase() ?? '')}</Text>
                        </HStack>
                        <HStack style={{alignItems: 'flex-end'}}>
                            <Text style={styles.th}>Veh: </Text>
                            <Text style={styles.td}>{Orden?.Camione?.BRAND+" "+Orden?.Camione?.MODEL+" ("+Orden?.Camione?.PLATE+")"}</Text>
                        </HStack>
                        {!Orden?.Camione.Container ?
                        <HStack style={{alignItems: 'flex-end'}}>
                            <Text style={styles.th}>Cont.: </Text>
                            <Text style={styles.td}>{Orden?.Container?.CLASC+" "+Orden?.Container?.CMODE+" ("+Orden?.Container?.CPLAT+")"}</Text>
                        </HStack>:''}
                        <HStack style={{alignItems: 'flex-end'}}>
                            <Text style={styles.th}>Medidas: </Text>
                            <Text style={styles.td}>{Orden?.Container?.XLONG}m X {Orden?.Container?.YWIDT}m X {Orden?.Container?.ZHEIG}m</Text>
                        </HStack>
                        {configOrden?.paletas_estandar?.length ?
                        <HStack style={{alignItems: 'flex-end'}}>
                            <Text style={styles.th}>Pal. Estandar Sel.: </Text>
                            <Text style={styles.td}>{configOrden.paletas_estandar[paletaIDX].l}m X {configOrden.paletas_estandar[paletaIDX].a}m X {configOrden.paletas_estandar[paletaIDX].h_force ? configOrden.paletas_estandar[paletaIDX].h:parseFloat(((Orden?.Container?.ZHEIG)-(Orden?.Container?.ZHEIG*configOrden?.p_espacio_alto))/dividirAlto).toFixed(2)}m</Text>
                        </HStack>:''}
                        <HStack style={{alignItems: 'flex-end'}}>
                            <Text style={styles.th}>F. Salida: </Text>
                            <Text style={styles.td}>{(Orden?.PlanedRoute?.POUTP ?? Orden?.DATEC)?.substr(0,16)?.replace("T"," ")}</Text>
                        </HStack>
                    </VStack>}
                    <VStack border={0} p={5} spacing={3}>
                        <HStack style={{justifyContent: 'space-between', alignItems: 'center'}}>
                            <PieChart
                                donut
                                radius={32}
                                innerRadius={24}
                                //innerCircleColor="transparent"
                                data={getPeso < 100 ? [{
                                    value: getPeso,
                                    color: getColorPeso(getPeso)
                                }, {
                                    value: 100-getPeso,
                                    color: 'lightgrey'
                                }]:[{
                                    value: getPeso,
                                    color: '#ad0000'
                                }]} 
                                centerLabelComponent={() => <Text style={styles.percentage}>{getPeso.toFixed(1)}%</Text>}
                                style={{width: 20, height: 20}}
                            />
                            <PieChart
                                donut
                                showText
                                innerRadius={0}
                                textColor="black"
                                radius={32}
                                data={[
                                    {value: (paletasRestantesMemo+Orden?.Paletas.length) <= 0 ? Orden?.Paletas.length:(Orden?.Paletas.length/(paletasRestantesMemo+Orden?.Paletas.length))*100, color: '#ff4a4a', text: Orden?.Paletas?.length+' pal', textSize: 9.5, fontWeight: '600'},
                                    {value: (paletasRestantesMemo+Orden?.Paletas.length) <= 0 ? 1:100-((Orden?.Paletas.length/(paletasRestantesMemo+Orden?.Paletas.length))*100), color: '#00894a', text: (paletasRestantesMemo)+' max', textSize: 9.5, fontWeight: '600'}
                                ]}
                            />
                            <PieChart 
                                donut
                                radius={32}
                                innerRadius={24}
                                data={getVolumen < 100 ? [{
                                    value: getVolumen,
                                    color: getColorVolumen(getVolumen)
                                }, {
                                    value: 100-getVolumen,
                                    color: 'lightgrey'
                                }]:[{
                                    value: getVolumen,
                                    color: '#ad0000'
                                }]}
                                centerLabelComponent={() => <Text style={styles.percentage}>{getVolumen.toFixed(1)}%</Text>}
                            />
                            
                        </HStack>
                        <HStack style={{justifyContent: 'space-between', alignItems: 'center'}}>
                            <VStack>
                                <Text style={styles.th}>Peso act: 
                                    <Text style={styles.td}>{Orden?.Paletas?.reduce((prev, val) => prev+parseFloat(val.WEIGH ?? val.PESO ?? 0),0)?.toFixed(2)} {Orden?.Camione?.DDMSG}</Text>
                                </Text>
                                <Text style={styles.th}>Peso max: 
                                    <Text style={styles.td}>{Orden?.PESO_MAX} {Orden?.Camione?.DDMSG}</Text>
                                </Text>
                            </VStack>
                            <VStack>
                                <Text style={styles.th}>Vol act: 
                                    <Text style={styles.td}>{Orden?.Paletas.reduce((prev, val) => prev+parseFloat(val.DISTX && val.DISTY && val.DISTZ ? (val.DISTX*val.DISTY*val.DISTZ):(val.VOLUMEN ?? 0)),0)?.toFixed(2)} {Orden?.Camione?.DDMSM}</Text>
                                </Text>
                                <Text style={styles.th}>Vol max: 
                                    <Text style={styles.td}>{Orden?.VOLUMEN_MAX} {Orden?.Camione?.DDMSM}</Text>
                                </Text>
                            </VStack>
                        </HStack>
                    </VStack>
                    {Orden?.TLATI && Orden?.TLONG ?
                    <Button title="Última Ubicación" color={Global.colorMundoTotal} variant="outlined" style={{fontSize: 12, marginTop: -2, alignSelf: 'flex-end'}}
                        trailing={<MI name="google-maps" size={24} />}
                        onPress={() => Linking.openURL(`https://www.google.com/maps/place/${Orden?.TLATI},${Orden?.TLONG}?hl=es&travelmode=driving`)}
                        //onPress={() => console.log(`https://www.google.com/maps?q=${Orden?.TLATI},${Orden?.TLONG}+(${Orden?.DCONC.replaceAll(' ','+')})`)}
                    />:''}
                    {props.dataUser.CAMIONERO && Orden?.STSOR === 1 ?
                    <Button title="Salir a ruta" color={Global.colorMundoTotal}  disabled={loading} onPress={() => salirOrden()} trailing={<MI name="truck-fast" size={24}/>}/>:''}
                </Box>

            </Stack>
            <TabView
                navigationState={{ index, routes }}
                renderScene={_renderScene}
                onIndexChange={setIndex}
                initialLayout={{ width: layout.width }}
                renderTabBar={props => <TabBar {...props} style={{backgroundColor: Global.colorMundoTotal}}/>} // <-- add this line
            />
            
            {modalPallet &&
            <Dialog visible={modalPallet !== null} onDismiss={() => setModalPallet(null)}>
                <DialogHeader title={"Configurar Paleta "+modalPallet.substr(-3).padStart(3, '0')} />
                <DialogContent>
                    <HStack style={{justifyContent: 'space-between', alignItems: 'center'}}>
                        <VStack w={"28%"}>
                            <Text style={styles.small}>max. {Orden?.Container.XLONG}m</Text>
                            <Text>Largo</Text>
                            <TextInput 
                                variant="standard" 
                                keyboardType="numeric"
                                placeholder="Largo"
                                value={inputs.largo?.toString() ?? ""}
                                onChangeText={(text) => setInputs({...inputs, largo: !text ? null:!/^\d{1,13}$|(?=^.{1,13}$)^\d+\.\d{0,3}$/.test(text) ? inputs.largo:text})}
                                inputStyle={{fontSize: 14}}
                                maxLength={13}/>
                        </VStack>
                        <VStack w={"28%"}>
                            <Text style={styles.small}>max. {((Orden?.Container.YWIDT-(Orden?.Container.YWIDT*configOrden?.p_espacio_ancho*dividirAncho*2))/dividirAncho).toFixed(2)}m</Text>
                            <Text>Ancho</Text>
                            <TextInput 
                                variant="standard" 
                                keyboardType="numeric"
                                placeholder="Ancho"
                                value={inputs.ancho?.toString() ?? ""}
                                onChangeText={(text) => setInputs({...inputs, ancho: !text ? null:!/^\d{1,13}$|(?=^.{1,13}$)^\d+\.\d{0,3}$/.test(text) ? inputs.ancho:text})}
                                numeric
                                maxLength={13}/>
                        </VStack>
                        <VStack w={"28%"}>
                            <Text style={styles.small}>max. {((Orden?.Container.ZHEIG-(Orden?.Container.ZHEIG*configOrden?.p_espacio_alto))/dividirAlto).toFixed(2)}m</Text>
                            <Text>Alto</Text>
                            <TextInput 
                                variant="standard" 
                                keyboardType="numeric"
                                placeholder="Alto"
                                value={inputs.alto?.toString() ?? ""}
                                onChangeText={(text) => setInputs({...inputs, alto: !text ? null:!/^\d{1,13}$|(?=^.{1,13}$)^\d+\.\d{0,3}$/.test(text) ? inputs.alto:text})}
                                numeric
                                maxLength={13}/>
                        </VStack>
                    </HStack>
                    <VStack w={"40%"} style={{alignSelf: 'center'}} m={4}>
                        <SelectInput
                            searchable={true}
                            data={[{label: "Mts", value: "M"}]}
                            value={inputs.longitud_medida}
                            setValue={(val) => setInputs({...inputs, longitud_medida: val})}
                            title="Medida"
                            buttonStyle={{width: 'auto'}}
                        />
                    </VStack>
                    <HStack style={{justifyContent: 'space-between', alignItems: 'center'}}>
                        <VStack w={"45%"}>
                            <Text>Peso</Text>
                            <TextInput 
                                variant="standard" 
                                keyboardType="numeric"
                                placeholder="Peso"
                                value={inputs.peso?.toString() ?? ""}
                                onChangeText={(text) => setInputs({...inputs, peso: !text ? null:!/^\d{1,13}$|(?=^.{1,13}$)^\d+\.\d{0,3}$/.test(text) ? inputs.peso:text})}
                                numeric
                                maxLength={13}/>
                        </VStack>
                        <VStack>
                            <SelectInput
                                searchable={true}
                                data={[{label: "KG", value: "KG"}]}
                                value={inputs.peso_medida}
                                setValue={(val) => setInputs({...inputs, peso_medida: val})}
                                title="Medida"
                                buttonStyle={{width: 'auto'}}
                            />
                        </VStack>
                    </HStack>
                </DialogContent>

                <DialogActions>
                    <Button
                        title="Guardar"
                        compact
                        variant="text"
                        onPress={() => {
                            let ordenProvi = JSON.parse(JSON.stringify(Orden));
                            for(let pal of ordenProvi.Paletas) {
                                if(pal.IDPAL === modalPallet) {
                                    if(ordenProvi.PESO_MAX && inputs.peso > ordenProvi.PESO_MAX) {
                                        return ToastAndroid.show("Error, no puedes colocar un peso mayor al soportado por el camión.", ToastAndroid.LONG);
                                    }
                                    if(ordenProvi.Container?.XLONG && inputs.largo > ordenProvi.Container?.XLONG) {
                                        return ToastAndroid.show("Error, no puedes colocar un largo mayor al soportado por el camión.", ToastAndroid.LONG);
                                    }
                                    if(ordenProvi.Container?.YWIDT && inputs.ancho > ordenProvi.Container?.YWIDT) {
                                        return ToastAndroid.show("Error, no puedes colocar un ancho mayor al soportado por el camión.", ToastAndroid.LONG);
                                    }
                                    if(ordenProvi.Container?.ZHEIG && inputs.alto > ordenProvi.Container?.ZHEIG) {
                                        return ToastAndroid.show("Error, no puedes colocar un alto mayor al soportado por el camión.", ToastAndroid.LONG);
                                    }
                                    pal.WEIGH = inputs.peso;
                                    pal.DISTX = inputs.largo;
                                    pal.DISTY = inputs.ancho;
                                    pal.DISTZ = inputs.alto;
                                    pal.MSEHI = inputs.peso_medida;
                                    pal.DDMSE = inputs.longitud_medida;
                                    break;
                                }
                            }
                            let datos = {
                                id: modalPallet,
                                update: {
                                    WEIGH: inputs.peso,
                                    DISTX: inputs.largo,
                                    DISTY: inputs.ancho,
                                    DISTZ: inputs.alto,
                                    MSEHI: inputs.peso_medida,
                                    DDMSE: inputs.longitud_medida
                                }
                            };
                            setLoading(true);
                            fetchIvan(props.ipSelect).put('/crudPaletas', datos, props.token.token)
                            .then(({data}) => {
                                console.log("Paleta actualizada: ", data.data);
                                props.route.params.setOrden(ordenProvi);
                                setOrden(ordenProvi);
                                setModalPallet(null);
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
                        }}
                    />
                </DialogActions>
            </Dialog>}

            {modalTruck &&
            <Dialog visible={modalTruck} onDismiss={() => setModalTruck(false)}>
                <DialogHeader title={<Text style={{fontWeight: 'bold', fontSize: 14, textAlign: 'center', alignSelf: 'center'}}>Configurar carga del contenedor (Valores estimados)</Text>}/>
                <DialogContent>
                    <VStack>
                        <Text style={styles.th2}>Medidas Contenedor:</Text>
                        <HStack style={{alignItems: 'flex-end'}}>
                            <Text style={styles.th2}>L: </Text>
                            <Text style={styles.td2}>{Orden?.Container?.XLONG}m</Text>
                            <Text style={styles.th2}> A: </Text>
                            <Text style={styles.td2}>{Orden?.Container?.YWIDT}m</Text>
                            <Text style={styles.th2}> H: </Text>
                            <Text style={styles.td2}>{Orden?.Container?.ZHEIG}m</Text>
                        </HStack>
                    </VStack>
                    <VStack mt={5} mb={5}>
                        <Text style={styles.th2}>Medidas Estandar de Paletas:</Text>
                        <SelectInput
                            data={configOrden?.paletas_estandar.reduce((p, pal, idx) => [...p, {value: idx, label: `L: ${pal.l}m, A: ${pal.a}, H: ${pal.h_force ? pal.h:(parseFloat(((Orden?.Container?.ZHEIG)-(Orden?.Container?.ZHEIG*configOrden?.p_espacio_alto))/dividirAlto).toFixed(2))}m`}], [])}
                            value={paletaIDX}
                            setValue={(val) => {console.log(val); setPaletaIDX(val)}}
                            title="Sel. Paleta estandar"
                        />
                    </VStack>
                    {/*<Text style={styles.td2}>{configOrden?.p_espacio_ancho*100}% ({(((configOrden?.paletas_estandar[paletaIDX].a*dividirAncho*2))*100).toFixed(2)}cm) de espacio de ancho/paletas</Text>*/}
                    {configOrden?.paletas_estandar?.length && !configOrden?.paletas_estandar[paletaIDX].h_force ? 
                        <Text style={[styles.td2, , {textAlign: 'justify'}]}>
                            {configOrden?.p_espacio_ancho*100}% ({((Orden?.Container.YWIDT*configOrden?.p_espacio_ancho)*100).toFixed(2)}cm) de espacio de ancho/paletas/paredes
                        </Text>:''}
                    <Text style={[styles.td2, , {textAlign: 'justify'}]}>{configOrden?.p_espacio_alto*100}% ({((Orden?.Container.ZHEIG*configOrden?.p_espacio_alto)*100).toFixed(2)}cm) de espacio contra el techo recomendado</Text>
                    {/*<HStack mt={5} style={{alignItems: 'center'}}>
                        <Text style={styles.small}>Dividir Ancho</Text>
                        <Switch value={dividirAncho === 2 ? true:false} onValueChange={() => setDividirAncho(dividirAncho === 1 ? 2:1)} disabled={configOrden?.paletas_estandar?.length && configOrden?.paletas_estandar[paletaIDX].h_force ? true:false}/>
                        <Text style={styles.small}>max. {((Orden?.Container.YWIDT-(Orden?.Container.YWIDT*configOrden?.p_espacio_ancho*dividirAncho*2))/dividirAncho).toFixed(2)}m</Text>
                    </HStack> */}
                    <HStack mb={5} style={{alignItems: 'center'}}>
                        <Text style={styles.small}>Dividir Alto</Text>
                        <Switch value={dividirAlto === 2 ? true:false} onValueChange={() => setDividirAlto(dividirAlto === 1 ? 2:1)} disabled={configOrden?.paletas_estandar?.length && configOrden?.paletas_estandar[paletaIDX].h_force ? true:false}/>
                    </HStack>
                    <Text style={styles.small}>Max. Pal en estandar: {paletasRestantesMemo+(Orden?.Paletas?.length ?? 0)}</Text>
                    <Text style={styles.small}>Nº Paletas: {Orden?.Paletas?.length ?? 0}</Text>
                    <Text style={styles.small}>Cant. Res. Pal en estandar: {paletasRestantesMemo}</Text>
                </DialogContent>
                <DialogActions>
                    <Button
                        title="Salir"
                        compact
                        variant="text"
                        onPress={() => setModalTruck(false)}
                    />
                </DialogActions>
            </Dialog>}
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
    small: {
        fontSize: 12
    },
    th: {
        fontSize: 11.5,
        fontWeight: '500'
    },
    td: {
        fontSize: 10.5,
        fontWeight: '400'
    },
    th2: {
        fontSize: 13,
        fontWeight: '500'
    },
    td2: {
        fontSize: 12
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
    },
    percentage: {
        fontSize: 12,
        fontWeight: 'bold'
    }
});

export default Paletas;


function degreesToRadians(degrees) {
    var radians = (degrees * Math.PI)/180;
    return radians;
}