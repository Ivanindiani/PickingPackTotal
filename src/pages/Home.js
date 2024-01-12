import { ListItem, Stack, Text } from "@react-native-material/core";
import { useEffect, useState } from "react";
import { Alert, Image, ScrollView, StyleSheet } from "react-native";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import MaterialCI from "react-native-vector-icons/MaterialCommunityIcons";
import Feather from "react-native-vector-icons/Feather";

const Home = (props) => {
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
                    onPress: () => props.navigation.dispatch(e.data.action),
                    }]
                );
            }
    }), [props.navigation]);
    
    return (
        <Stack spacing={2} style={{ margin: 14 }}>
            <ScrollView style={styles.scrollView}>
                <Image source={require('../assets/images/PistoleoAppIcon.png') } style={styles.icon} resizeMode="center"/>
                <Text>Menú Inicio</Text>
                {props.dataUser.USSCO?.indexOf('NEWREG') !== -1 && !props.dataUser.CAMIONERO ?
                <ListItem
                    title="Registro de Productos"
                    leading={<FontAwesome name="registered" size={24} />}
                    trailing={props2 => <FontAwesome name="chevron-right" {...props2} />}
                />:''
                }
                {/*props.dataUser.USSCO?.indexOf('SCAN') !== -1 && 
                <ListItem
                    title="Traslado de Productos"
                    leading={<MaterialCI name="barcode-scan" size={24} />}
                    trailing={props2 => <FontAwesome name="chevron-right" {...props2} />}
                    //onPress={() => props.navigation.navigate('Traslados')}
                    onPress={() => props.navigation.navigate('TrasladosTab', {type_tras: 'crear_tras'})}
                />
                */}
                {props.dataUser.USSCO?.indexOf('TRASLADOS_FIND') !== -1 && 
                <ListItem
                    title="Traslado de Productos"
                    leading={<MaterialCI name="clipboard-list" size={24} />}
                    trailing={props2 => <FontAwesome name="chevron-right" {...props2} />}
                    //onPress={() => props.navigation.navigate('RecibirTraslados')}
                    onPress={() => props.navigation.navigate('TabOrdenes', {type_tras: 'crear_tras'})}
                />
                }
                {props.dataUser.USSCO?.indexOf('RECEIVE_TRAS') !== -1 && !props.dataUser.CAMIONERO ?
                <ListItem
                    title="Recibir Traslados"
                    leading={<Feather name="check-square" size={24} />}
                    trailing={props2 => <FontAwesome name="chevron-right" {...props2} />}
                    //onPress={() => props.navigation.navigate('RecibirTraslados')}
                    onPress={() => props.navigation.navigate('TrasladosTab', {type_tras: 'recibir_tras'})}
                />:''
                }
                {props.dataUser.USSCO?.indexOf('FIND_ARTBODEGA') !== -1 && !props.dataUser.CAMIONERO ?
                <ListItem
                    title="Almacén Inventario"
                    leading={<MaterialCI name="archive-search" size={24} />}
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
        </Stack>

    )
}

export default Home;

const styles = StyleSheet.create({
    title1: {
        alignSelf: 'center',
        fontSize: 16,
        fontWeight: 'bold'
    },
    icon: {
        width: 200,
        height: 150,
        alignSelf: 'center'
    }
})