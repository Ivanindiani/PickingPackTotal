import { useWindowDimensions } from 'react-native';
import { TabView, TabBar } from 'react-native-tab-view';
import Traslados from './Traslados';
import RecibirTraslados from './RecibirTraslados';
import TrasladosByCode from '../components/trasladosByCode';
import { useState } from 'react';
import PaletasByCode from '../components/paletasByCode';
const Global = require('../../app.json');

const TabTraslados = (props) => {
    
    const layout = useWindowDimensions();

    const [index, setIndex] = useState(0);
    const [routes] = useState(props.route.params.type_tras !== 'crear_tras' ? [
        { key: 'normal', title: 'Por\nParámetros' },
        { key: 'pallet', title: 'Códigos\nde Paletas' },
        { key: 'code', title: 'Por código\nde barra' },
    ]:[
        { key: 'normal', title: 'Por\nParámetros' },
        { key: 'code', title: 'Por código\nde barra' },
    ]);
    
    /*const _renderScene = useCallback(SceneMap({
        normal: FirstRoute,
        code: SecondRoute
    }));*/
    
    const _renderScene = ({ route }) => {
        switch(route.key) {
            case 'normal':
                return props.route.params.type_tras === 'crear_tras' ? <Traslados {...props} tabActive={index===0}/>:<RecibirTraslados {...props} tabActive={index===0}/>;
            case 'pallet':
                return <PaletasByCode {...props} type={props.route.params.type_tras} tabActive={index===1}/>;
            case 'code':
                return <TrasladosByCode {...props} type={props.route.params.type_tras} tabActive={index===2}/>;
        }
    }

    return (
        <TabView
            navigationState={{ index, routes }}
            renderScene={_renderScene}
            onIndexChange={setIndex}
            initialLayout={{ width: layout.width }}
            renderTabBar={props => <TabBar {...props} style={{backgroundColor: Global.colorMundoTotal}} labelStyle={{fontSize: 12}}/>} // <-- add this line
        />
    );
}

export default TabTraslados;