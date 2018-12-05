import React from 'react'
import { StyleSheet, SafeAreaView, Animated, Easing, Dimensions, FlatList, View, Text } from 'react-native'
import memoize from 'fast-memoize'
import { Svg } from 'expo'
import Color from 'color'

import Loop from './Loop'

var { heigh: windowHeight, width: windowWidth } = Dimensions.get('window');

const TIMER_DURATION = 60000
const TIMER_INTERVAL_DURATION = 4000
const TIMER_SECOND_LOOP_DURATION = 2000
const ITEM_HEIGHT = windowWidth
const HAS_INTERVAL = false


class Sequence extends React.Component {
  _keyExtractor = ({ id }) => `${id}`

  _renderTimer = ({ item: timer }) => (
    <Loop
      {...timer}
      width={15 / 100}
      loopRadius={3 / 10}
      xStartPosition={2 / 10}
      fillColor={`#5A7AED`}
      borderWidth={8 / 1000}
      borderColor={`#000000`}
    />
  )

  render() {
    const {
      timers,
    } = this.props

    return (
      <View
      style={styles.sequence}
      >
        <FlatList
          data={timers}
          keyExtractor={this._keyExtractor}
          renderItem={this._renderTimer}
          scrollEventThrottle={16}
        />
      </View>
    )
  }
}

const styles = StyleSheet.create({
  sequence: {
    flexDirection: 'column',
    width: windowWidth,
  }
})

export default Sequence
