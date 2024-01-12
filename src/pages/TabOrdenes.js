import { useWindowDimensions } from 'react-native';
import { TabView, TabBar } from 'react-native-tab-view';
import Ordenes from './Ordenes';
import PaletasByCode from '../components/paletasByCode';
import { useState } from 'react';
import TrasladosByCode from '../components/trasladosByCode';
const Global = require('../../app.json');

const TabOrdenes = (props) => {
    
    const layout = useWindowDimensions();

    const [index, setIndex] = useState(0);
    const [routes] = useState([
        { key: 'normal', title: 'Por\nÓrdenes' },
        { key: 'code', title: 'Códigos\nde Paletas' },
        { key: 'traslado', title: 'Por código\nde barra' },
    ]);
    
    /*const _renderScene = useCallback(SceneMap({
        normal: FirstRoute,
        code: SecondRoute
    }));*/
    
    const _renderScene = ({ route }) => {
        switch(route.key) {
            case 'normal':
                return <Ordenes {...props} tabActive={index===0}/>;
            case 'code':
                return <PaletasByCode {...props} type={props.route.params.type_tras} tabActive={index===1}/>;
            case 'traslado':
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

export default TabOrdenes;