import { memo, useEffect, useState } from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";

import {
    RecyclerListView,
    DataProvider,
    LayoutProvider,
} from 'recyclerlistview'; // Version can be specified in package.json
import _ from 'lodash';

const dimensionesScreen = Dimensions.get('window');

const createDataProvider = () => {
    return new DataProvider((r1, r2) => r1 !== r2);
};

const ListaPerform = memo(({items, renderItems, heightRemove=null, refreshGet, height = 90, refreshControl = null, forceHeight=true, header = '', ListEmptyComponent = <Text>...</Text>}) => {
    const [dataProvider, setDataProvider] = useState(createDataProvider());

    const _layoutProvider = new LayoutProvider(
        index => 0,
        (type, dim) => {
            dim.width = dimensionesScreen.width,
            dim.height = height
        }
    )

    useEffect(() => {
        if(items !== undefined) {
            setDataProvider(createDataProvider().cloneWithRows(items))
        }
    }, [items])

    return (
        <View style={{marginTop: 5, minHeight: 1, flex: 2, width: dimensionesScreen.width}}>
            {!items?.length ? ListEmptyComponent:
            <RecyclerListView
                layoutProvider={_layoutProvider}
                dataProvider={dataProvider}
                rowRenderer={(type, data, index) => renderItems(data, index)}
                scrollViewProps={{
                    refreshControl: refreshControl,
                    nestedScrollEnabled: true
                  }}
                forceNonDeterministicRendering={forceHeight} 
                canChangeSize={true}
            />}            
        </View>
    )
},(prevProps, nextProps) => {
    //console.log("Virtual list: ",_.isEqual(prevProps.items, nextProps.items),_.isEqual(prevProps.heightRemove, nextProps.heightRemove),_.isEqual(prevProps.renderItems, nextProps.renderItems), _.isEqual(prevProps.refreshGet, nextProps.refreshGet))
    //if (_.isEqual(prevProps, nextProps)) {
    if(_.isEqual(prevProps.items, nextProps.items) && _.isEqual(prevProps.renderItems, nextProps.renderItems)
        && prevProps.heightRemove === nextProps.heightRemove && prevProps.height === nextProps.height) {
            //console.log("Todo igual");
        return true; // props are equal
    }
    //console.log("Algo cambio");
    return false; // props are not equal -> update the component
})

const styles = StyleSheet.create({
    subtitle: {
        fontSize: 13,
    },
});

export default ListaPerform;
