import { memo, useEffect, useState } from "react";
import { Dimensions, RefreshControl, StyleSheet, Text, View } from "react-native";

import {
    RecyclerListView,
    DataProvider,
    LayoutProvider,
} from 'recyclerlistview'; // Version can be specified in package.json
import _ from 'lodash';

const dimensionesScreen = Dimensions.get('screen');

const createDataProvider = () => {
    return new DataProvider((r1, r2) => r1 !== r2);
};

const ListaPerform = memo(({items, renderItems, heightRemove, refreshGet, height = null}) => {
    const [dataProvider, setDataProvider] = useState(createDataProvider());

    const _layoutProvider = new LayoutProvider(
        index => 0,
        (type, dim) => {
            dim.width = dimensionesScreen.width,
            dim.height = height ? height:90
        }
    )

    useEffect(() => {
        if(items !== undefined) {
            setDataProvider(createDataProvider().cloneWithRows(items))
        }
    }, [items])

    return (
        <View style={{marginTop: 5, width: dimensionesScreen.width, height: dimensionesScreen.height-heightRemove}}>
            {!items?.length ? <Text style={styles.subtitle}>...</Text>:
            <RecyclerListView
                layoutProvider={_layoutProvider}
                dataProvider={dataProvider}
                rowRenderer={(type, data, index) => renderItems(data, index)}
                scrollViewProps={{
                    /*refreshControl: (
                        <RefreshControl
                        refreshing={false}
                        onRefresh={()=> refreshGet(true)}
                        />
                    ),*/
                    nestedScrollEnabled: true
                  }}
                forceNonDeterministicRendering={true} 
                //canChangeSize={true}
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
