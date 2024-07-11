import { memo, useEffect, useState } from "react";
import fetchIvan from "../components/_fetch";
import { Button, HStack, ListItem, Stack, Text } from "@react-native-material/core";
import { ActivityIndicator, Dimensions, StyleSheet, ToastAndroid, View } from "react-native";
import SelectInput from "../components/_virtualSelect";
import Entypo from "react-native-vector-icons/Entypo";
import { Agenda, LocaleConfig } from 'react-native-calendars';
import { SafeAreaView } from "react-native-safe-area-context";
const Global = require('../../app.json');

const ordenStatusColor = ['red', 'yellow', 'orange', 'lightgreen', 'green'];
const ordenStatus = ['Eliminado', 'Cargando en Origen', 'En Ruta', 'Recibiendo paquetes', 'Finalizada'];

LocaleConfig.locales['es'] = {
    monthNames: [
      'Enero',
      'Febrero',
      'Marzo',
      'Abril',
      'Mayo',
      'Junio',
      'Julio',
      'Agosto',
      'Septiembre',
      'Octubre',
      'Noviembre',
      'Diciembre'
    ],
    monthNamesShort: ['Ene.', 'Feb.', 'Mar.', 'Abr.', 'May.', 'Jun.', 'Jul.', 'Ago.', 'Sept.', 'Oct.', 'Nov.', 'Dic.'],
    dayNames: ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'],
    dayNamesShort: ['Dom.', 'Lun.', 'Mar.', 'Mie.', 'Jue.', 'Vie.', 'Sab.'],
    today: "Hoy"
};
LocaleConfig.defaultLocale = 'es';

const getDateDiff = (diff, date = undefined) => {
    let d = date ? new Date(date):new Date();
    d.setDate(d.getDate() + diff);
    return d.getFullYear()+"-"+(parseInt(d.getMonth())+1).toString().padStart(2, '0')+"-"+(parseInt(d.getDay())+1).toString().padStart(2, '0');
}
const minDate = getDateDiff(-30);
const maxDate = getDateDiff(30);

import _ from 'lodash';

const dimensiones = Dimensions.get('window');

console.log(dimensiones);

const Calendario = memo(({ordenes, getOrdenes, setOrden, navigation, almacenId}) => {
    const items = ordenes.data?.reduce((prev, ord) => {
        if(prev[ord.DATE_FORMAT]) {
            prev[ord.DATE_FORMAT].push(ord);
        } else {
            prev[ord.DATE_FORMAT] = [ord];
        }
        return prev;
    }, {});

    const marked = ordenes.data?.reduce((prev, ord) => {
        if(prev[ord.DATE_FORMAT]) {
            prev[ord.DATE_FORMAT].dots.push({
                key: ord.IDTRG,
                marked: true,
                color: ordenStatusColor[ord.STSOR],
                style: {
                    border: 1
                }
            });
        } else {
            prev[ord.DATE_FORMAT] = {
                    dots: [{
                    key: ord.IDTRG,
                    marked: true,
                    color: ordenStatusColor[ord.STSOR],
                    style: {
                        border: 1
                    }
                }]
            };
        }
        return prev;
    }, {});

    return <Agenda 
            items={items}
            markedDates={marked}
            markingType="multi-dot"
            onDayChange={day => {
                console.log('day changed');
            }}
            showOnlySelectedDayItems={false}
            showClosingKnob
            minDate={minDate}
            maxDate={maxDate}
            pastScrollRange={15}
            futureScrollRange={15}
            onRefresh={() => getOrdenes(getDateDiff(-30), getDateDiff(30)).catch((e) => console.log(e))}
            //refreshing={loading}
            disabledByDefault={!almacenId}
            rowHasChanged={(r1, r2) => {
                return r1.IDTRG !== r2.IDTRG;
            }} 
            renderEmptyData={() => {
                return <Text>No hay ordenes para este día</Text>;
            }}
            renderItem={(orden, first) => {
                return (
                    <ListItem
                        key={orden.IDTRG}
                        overline={ordenStatus[orden.STSOR]}
                        title={orden.DCONC} 
                        secondaryText={<View style={{maxWidth: dimensiones.width*0.45}}>
                            <HStack>
                                <Text style={[styles.th, styles.secondaryText]}>Chofer: </Text>
                                <Text style={[styles.td, styles.secondaryText]}>{orden.Chofere?.DNAME+" "+orden.Chofere?.DFNAM}</Text>
                            </HStack>
                            <HStack>
                                <Text style={[styles.th, styles.secondaryText]}>Vehículo: </Text>
                                <Text style={[styles.td, styles.secondaryText]}>{orden.Camione?.BRAND+" "+orden.Camione?.MODEL+" ("+orden.Camione?.PLATE+")"}</Text>
                            </HStack>
                            {!orden.Container?.IDTRU && <HStack>
                                <Text style={[styles.th, styles.secondaryText]}>Cont: </Text>
                                <Text style={[styles.td, styles.secondaryText]}>{orden.Container?.CLASC+" "+orden.Container?.CMODE+" ("+orden.Container?.CPLAT+")"}</Text>
                            </HStack>}
                            <HStack>
                                <Text style={[styles.th, styles.secondaryText]}>Peso max: </Text>
                                <Text style={[styles.td, styles.secondaryText]}>{orden.PESO_MAX} KG</Text>
                            </HStack>
                            <HStack>
                                <Text style={[styles.th, styles.secondaryText]}>Vol max: </Text>
                                <Text style={[styles.td, styles.secondaryText]}>{orden.PESO_MAX} M3</Text>
                            </HStack>
                            <HStack>
                                <Text style={[styles.th, styles.secondaryText]}>Tiendas: </Text>
                                <Text style={[styles.td, styles.secondaryText]}>{orden.PlanedRoute?.PJWER.tiendas.join(', ') ?? ''}</Text>
                            </HStack>
                            {orden.PlanedRoute?.PJWER.pedidos?.length ?
                            <HStack>
                                <Text style={[styles.th, styles.secondaryText]}>Pedidos: </Text>
                                <Text style={[styles.td, styles.secondaryText]}>{orden.PlanedRoute?.PJWER.pedidos.join(', ') ?? ''}</Text>
                            </HStack>:''}
                        </View>
                        }
                        leading={<Entypo name="circle" size={20} backgroundColor={ordenStatusColor[orden.STSOR]} color={ordenStatusColor[orden.STSOR]} style={{borderRadius: 12, margin: 0, padding: 0}} />}
                        leadingMode="icon"
                        onPress={() => navigation.navigate('Paletas', {
                            orden: orden,
                            setOrden: setOrden,
                            configOrden: ordenes.extra,
                            updateOrden: getOrdenes,
                            centroId: orden.FWERK,
                            almacenId: orden.FLGOR,
                            datemin: minDate,
                            datemax: maxDate
                        })}
                    />)
            }}
            theme={{
                agendaDayTextColor: 'black',
                agendaDayNumColor: 'green',
                agendaTodayColor: 'red',
                agendaKnobColor: Global.colorMundoTotal,
                selectedDayBackgroundColor: Global.colorMundoTotal
            }}
        />
}, (prevProps, nextProps) => {
    if(!_.isEqual(prevProps.ordenes, nextProps.ordenes) || !_.isEqual(prevProps.ordenes?.data, nextProps.ordenes?.data)) return false;
    console.log("No RENDER");
    return true;
});

const Ordenes = (props) => {
    const [loading, setLoading] = useState(false);
    const [ordenes, setOrdenes] = useState({});
    const [centroId, setCentroId] = useState(props.dataUser.Centros?.length === 1 ? props.dataUser.Centros[0].WERKS:null);
    const [centrosUser] = useState(props.dataUser.Centros?.length ? props.dataUser.Centros.reduce((prev, d) => props.dataUser.Restringe?.indexOf(d.WERKS) !== -1 ? [...prev, {label: d.NAME1, value: d.WERKS}]:prev,[]):[]);
    const [almacenes, setAlmacenes] = useState([]);
    const [almacenId, setAlmacenId] = useState(null);

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
            //setOrdenes({});
        }
    }, [centroId]);

    useEffect(() => {
        console.log(centroId, almacenId);
        if((centroId && almacenId) || props.dataUser.CAMIONERO) {
            getOrdenes(getDateDiff(-30), getDateDiff(30)).catch((e) => console.log(e));
        }
    }, [almacenId, props.dataUser.CAMIONERO === true]);

    async function getOrdenes(datemin=undefined,datemax=undefined) {
        if(!centroId && !almacenId && !props.dataUser.CAMIONERO) return;
        console.log("GET ORDERS", datemin, datemax);
        setLoading(true);
        return new Promise((resolve, reject) => {
            let datos = [
                `FWERK=${centroId}`,
                `FLGOR=${almacenId}`,
                `paletas=true`,
                `pallettras=true`,
                `DATEMIN=${datemin}`,
                `DATEMAX=${datemax}`
            ];
            if(props.dataUser.CAMIONERO) {
                datos.push(`IDDRI=${props.dataUser.IDDRI}`)
            }
            fetchIvan(props.ipSelect).get('/crudOrdenes', datos.join('&'), props.token.token)
            .then(({data}) => {
                console.log("Ordenes: ", data.data.length);
                setOrdenes(data);
                resolve(data.data);
            })
            .catch(({status, error}) => {
                console.log(error);
                /*if(status === 401 && error.text.indexOf("autorización") !== -1) {
                    //props.navigation.popToTop();
                    props.navigation.navigate('Login', {hola : true});
                }*/
                ToastAndroid.show(
                    error?.text || error?.message || (error && typeof(error) !== 'object' && error.indexOf("request failed") !== -1 ? "Por favor chequea la conexión a internet":"Error interno, contacte a administrador"),
                    ToastAndroid.SHORT
                );
                reject(error);
            })
            .finally(() => {
                setLoading(false);
            });
        });
    }

    /*useEffect(() => {
        if((centroId && almacenId) || props.dataUser.CAMIONERO) 
            getOrdenes();
    }, [almacenId, props.dataUser.CAMIONERO === true]);*/

    const setOrden = (orden) => {
        let ordns = JSON.parse(JSON.stringify(ordenes));
        setOrdenes({});

        for(let i=0;i < ordns.data.length;i++){
            if(orden.IDTRG === ordns.data[i].IDTRG) {
                ordns.data[i] = orden;
                break; 
            }
        }
        setTimeout(() => setOrdenes(ordns), 100);
    }
    
    return (
        <SafeAreaView style={{flex: 1}}>
            <Stack spacing={1} style={{ margin: 5, flex: 2}}>
                
                {!props.dataUser.CAMIONERO ? <View style={styles.centros}>
                    <Text style={{fontWeight: '500'}}>Sucursal: </Text>
                    <SelectInput
                        searchable={false}
                        data={centrosUser}
                        value={centroId}
                        setValue={setCentroId}
                        title="Sucursal Origen"
                        buttonStyle={{maxWidth: '70%', padding: 3}}
                    />
                    
                </View>:<View style={styles.centros}>
                    <Button onPress={()=> getOrdenes(getDateDiff(-30), getDateDiff(30)).catch((e) => console.log(e))} title="Actualizar" color={Global.colorMundoTotal} loading={loading}/>
                </View>}
            
                {!props.dataUser.CAMIONERO && centroId && almacenes.length ?
                <View style={styles.centros}>
                    <Text style={{fontWeight: '500'}}>División: </Text>
                    <SelectInput
                        searchable={false}
                        data={almacenes}
                        value={almacenId}
                        setValue={setAlmacenId}
                        title="División origen"
                        buttonStyle={{maxWidth: '70%', alignSelf: 'flex-end'}}
                    />
                </View>:''}
                {loading && <ActivityIndicator/>}
                
                <Calendario ordenes={ordenes} getOrdenes={getOrdenes} setOrden={setOrden} navigation={props.navigation} almacenId={almacenId || props.dataUser.CAMIONERO}/>
            </Stack>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    scrollView: {
        marginTop: 10,
        zIndex: 9
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
        padding: 5,
        borderBottomLeftRadius: 5,
        borderBottomRightRadius: 5,
        borderTopLeftRadius: 5,
        borderTopRightRadius: 5
    },
    th: {
        fontSize: 12,
        fontWeight: '400'
    },
    td: {
        fontSize: 11
    },
    textSecondary: {
        color: 'grey',
    }
});

export default Ordenes;