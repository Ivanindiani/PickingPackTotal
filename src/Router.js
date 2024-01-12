import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
const Global = require('../app.json');

import HeaderMundo from './components/HeaderMundo';

import Login from './pages/Login';
import Home from './pages/Home';
import Scaneo from './pages/Scaneo';
import RecibirTraslados from './pages/RecibirTraslados';
import VerItems from './pages/VerItems';
import TabTraslados from './pages/TabTraslados';
import AlmacenInv from './pages/AlmacenInv';
//import Ordenes from './pages/Ordenes';
import Paletas from './pages/Paletas';
import TabOrdenes from './pages/TabOrdenes';
import Traslados from './pages/Traslados';

const Stack = createNativeStackNavigator();

const Router = (props) => {
    return(
        <NavigationContainer>
            <Stack.Navigator initialRouteName="Login">
                <Stack.Screen name="Login" options={() => optionsBar(Global.name+"\n Login", props)}>
                    {(p2) =><Login {...props} {...p2}/>}
                </Stack.Screen>
                <Stack.Screen name="Home" options={() => optionsBar(Global.name+"\n Home", props)}>
                    {(p2) =><Home {...props} {...p2}/>}
                </Stack.Screen>
                <Stack.Screen name="TrasladosTab" options={() => optionsBar(Global.name+(props.type === 'crear_tras' ? "\n Traslados":"\n Recibir Traslado"), props)}>
                    {(p2) =><TabTraslados {...props} {...p2}/>}
                </Stack.Screen>
                <Stack.Screen name="Traslados" options={() => optionsBar(Global.name+"\n Traslados", props)}>
                    {(p2) =><Traslados {...props} {...p2}/>}
                </Stack.Screen>
                <Stack.Screen name="Scaneo" options={() => optionsBar(Global.name+"\n Escaneo de productos", props)}>
                    {(p2) =><Scaneo {...props} {...p2}/>}
                </Stack.Screen>
                <Stack.Screen name="RecibirTraslados" options={() => optionsBar(Global.name+(!props.dataUser.CAMIONERO ? "\n Recibir Traslados":"\n Traslados"), props)}>
                    {(p2) =><RecibirTraslados {...props} {...p2}/>}
                </Stack.Screen>
                <Stack.Screen name="VerItems" options={() => optionsBar(Global.name+(!props.dataUser.CAMIONERO ? "\n Recibir Traslado - Productos":"\n Traslado - Productos"), props)}>
                    {(p2) =><VerItems {...props} {...p2}/>}
                </Stack.Screen>
                <Stack.Screen name="AlmacenInv" options={() => optionsBar(Global.name+"\n Almacén Inventarios", props)}>
                    {(p2) =><AlmacenInv {...props} {...p2}/>}
                </Stack.Screen>
                <Stack.Screen name="TabOrdenes" options={() => optionsBar(Global.name+"\n Traslado de Productos", props)}>
                    {(p2) =><TabOrdenes {...props} {...p2}/>}
                </Stack.Screen>
                {/*<Stack.Screen name="Ordenes" options={() => optionsBar(Global.name+"\n Órdenes de traslados", props)}>
                    {(p2) =><Ordenes {...props} {...p2}/>}
                </Stack.Screen>*/}
                <Stack.Screen name="Paletas" options={() => optionsBar(Global.name+"\n Órden de traslado", props)}>
                    {(p2) =><Paletas {...props} {...p2}/>}
                </Stack.Screen>
            </Stack.Navigator>
        </NavigationContainer>
    )
}

export default Router;

const optionsBar = (title, otherprops) => {
    return {
        headerBackVisible: false,
        headerStyle: {
            backgroundColor: Global.colorMundoTotal,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
            fontWeight: 'bold',
        },
        headerTitle: () => <HeaderMundo title={title} {...otherprops} />,
    }
}