import { useWindowDimensions, View } from 'react-native';
import { TabView, TabBar } from 'react-native-tab-view';
import { useRef, useState } from 'react';
import ScaneoPedido from './ScaneoPedido';
import Pedidos from './Pedidos';
const Global = require('../../app.json');

const TabScaneo = (props) => {
    
    const layout = useWindowDimensions();

    const [index, setIndex] = useState(0);
    const [routes] = useState([
        { key: 'pedido', title: 'Ver pedido' },
        { key: 'scan', title: 'Escanear' },
    ]);

    const [pedido, setPedido] = useState([]);

    const pedidoRef = useRef(null);
    
    /*const _renderScene = useCallback(SceneMap({
        normal: FirstRoute,
        code: SecondRoute
    }));*/
    
    const _renderScene = ({ route }) => {
        switch(route.key) {
            case 'pedido':
                return <Pedidos {...props} pedido={pedido} setPedido={setPedido} ref={pedidoRef}/>;
            case 'scan':
                return <ScaneoPedido {...props} pedido={pedido} setPedido={setPedido} updatePedido={(show=false) => pedidoRef.current?.getItems(show)}/>;
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

export default TabScaneo;