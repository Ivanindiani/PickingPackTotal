import { ListItem, Stack, Text } from "@react-native-material/core";
import { useEffect } from "react";
import { Alert, Image, PermissionsAndroid, Platform, ScrollView, StyleSheet } from "react-native";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import MaterialCI from "react-native-vector-icons/MaterialCommunityIcons";
import Feather from "react-native-vector-icons/Feather";
import Octicons from "react-native-vector-icons/Octicons";
import AntDesign from 'react-native-vector-icons/AntDesign';

const Global = require('../../app.json');
const Home = (props) => {
    const requestPhoneState = async () => {
        try {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                {
                    title: 'Solicitud de permisos de ubicación',
                    message: 'Necesitamos que hábilites el permiso para acceder a la ubicación de tu teléfono.',
                    buttonNeutral: 'Pregunta más tarde',
                    buttonNegative: 'No',
                    buttonPositive: 'Permitir',
                },
            );
            if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                console.log("PhoneSTATE permisos otorgado");
            } else {
                console.log('PhoneSTATE permisos denegado');
            }

        } catch (err) {
          console.warn(err);
        }
    };
    
    useEffect(() => {
        if(Platform.OS === 'android') {
            requestPhoneState();
        }
    }, []);

    useEffect(() => 
        props.navigation.addListener('beforeRemove', (e) => {
            console.log(e.data.action);
            if(e.data.action.type === 'GO_BACK') {
                e.preventDefault();
                Alert.alert(
                    'Cierre de sesión',
                    '¿Seguro que deseas cerrar sesión?',
                    [{ text: "Cancelar", style: 'cancel', onPress: () => {} },
                    {
                    text: 'Confirmar',
                    style: 'destructive',
                        onPress: () => {
                            props.navigation.dispatch(e.data.action);
                            props.setDataToken({});
                            props.setDataUser({});
                        }
                    }]
                );
            }
    }), [props.navigation]);
    
    return (
        <Stack spacing={4} style={{ margin: 14, flex: 1 }}>
            <ScrollView style={styles.scrollView}>
                <Text style={styles.title2}>Hola{"\n"}{props.dataUser.CAMIONERO ? props.dataUser.DNAME+" "+(props.dataUser.DFNAM??''):props.dataUser.USNAM+" "+(props.dataUser.USLAS??'')}</Text>
                <Image source={require('../assets/images/Logo.png') } style={styles.icon} resizeMode="cover"/>
                <Text>Menú Inicio</Text>
                {(props.dataUser.USSCO?.split(',').indexOf('RECEPCION_FIND') !== -1 || props.dataUser.USSCO?.split(',').indexOf('ADMIN_RECEPCION') !== -1) 
                    && !props.dataUser.CAMIONERO ?
                <ListItem
                    title="Recepción de Productos"
                    leading={<Octicons name="package-dependencies" size={24} />}
                    trailing={props2 => <FontAwesome name="chevron-right" {...props2} />}
                    onPress={() => props.navigation.navigate('Recepcion')}
                />:''
                }
                {/*props.dataUser.USSCO?.split(',').indexOf('SCAN') !== -1 && 
                <ListItem
                    title="Traslado de Productos"
                    leading={<MaterialCI name="barcode-scan" size={24} />}
                    trailing={props2 => <FontAwesome name="chevron-right" {...props2} />}
                    //onPress={() => props.navigation.navigate('Traslados')}
                    onPress={() => props.navigation.navigate('TrasladosTab', {type_tras: 'crear_tras'})}
                />
                */}
                {props.dataUser.USSCO?.split(',').indexOf('TRASLADOS_FIND') !== -1 && 
                <ListItem
                    title="Traslados de Productos"
                    leading={<MaterialCI name="truck-delivery" size={24} />}
                    trailing={props2 => <FontAwesome name="chevron-right" {...props2} />}
                    //onPress={() => props.navigation.navigate('RecibirTraslados')}
                    onPress={() => props.navigation.navigate('TabOrdenes', {type_tras: 'crear_tras'})}
                />
                }
                {props.dataUser.USSCO?.split(',').indexOf('RECEIVE_TRAS') !== -1 && !props.dataUser.CAMIONERO ?
                <ListItem
                    title="Recepción de Traslados"
                    leading={<Feather name="check-square" size={24} />}
                    trailing={props2 => <FontAwesome name="chevron-right" {...props2} />}
                    //onPress={() => props.navigation.navigate('RecibirTraslados')}
                    onPress={() => props.navigation.navigate('TrasladosTab', {type_tras: 'recibir_tras'})}
                />:''
                }
                {props.dataUser.USSCO?.split(',').indexOf('FIND_ARTBODEGA') !== -1 && !props.dataUser.CAMIONERO ?
                <ListItem
                    title="Almacén Inventario"
                    leading={<MaterialCI name="warehouse" size={24} />}
                    trailing={props2 => <FontAwesome name="chevron-right" {...props2} />}
                    onPress={() => props.navigation.navigate('AlmacenInv')}
                />:''
                }
                <ListItem
                    title="Cerrar Sesión"
                    leading={<MaterialCI name="logout" size={24} />}
                    trailing={props2 => <FontAwesome name="chevron-right" {...props2} />}
                    onPress={() => props.navigation.goBack()}
                />
            </ScrollView>
            <Text style={styles.footer}><AntDesign name="infocirlce" color={Global.colorMundoTotal} size={18} onPress={() =>{
                return Alert.alert("TotalWMS", "Versión de la aplicación: V"+props.deviceInfo.version+"\n\nDevelop and report error: \nIvan Gulfo\nivansicol@gmail.com")
            }}/> V{props.deviceInfo.version} | {props.deviceInfo.id}</Text>
        </Stack>

    )
}

export default Home;

const styles = StyleSheet.create({
    title1: {
        alignSelf: 'center',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center'
    },
    title2: {
        alignSelf: 'center',
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
        margin: 5
    },
    icon: {
        width: 190,
        height: 140,
        alignSelf: 'center',
        borderRadius: 20
    },
    scrollView: {
        borderRadius: 20
    },
    footer: {
        position: 'absolute',
        left: 0,
        bottom: -5,
        fontSize: 12,
        zIndex: 100
    }
})