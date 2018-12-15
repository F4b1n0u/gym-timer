import React from 'react'
import { StyleSheet, SafeAreaView, Easing, FlatList } from 'react-native'
import Sequence from './Sequence'

const timerIds = [
  0,
  1,
  2,
  // 3,
  // 4,
  // 5,6,7,8,9,
  // 10,11,12,13,14,15,16,17,18,19,
  // 20,21,22,23,24,25,26,27,28,29,
  // 30,31,32,33,34,35,36,37,38,39,
  // 40,41,42,43,44,45,46,47,48,49,
  // 50,51,52,53,54,55,56,57,58,59,
  // 60,61,62,63,64,65,66,67,68,69,
  // 70,71,72,73,74,75,76,77,78,79,
  // 80,81,82,83,84,85,86,87,88,89,
  // 90,91,92,93,94,95,96,97,98,99
]

class App extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      sequences: [
        {
          id: 100,
          timers: timerIds.map((id, index) => ({
            id,
            durations: {
              in: 1000,
              // loop: 5000 + (index % 6) * 10000,
              loop: 7000,
            },
            easings: {
                in: Easing.in(Easing.bounce),
                loopIn: Easing.in(Easing.ease), // if loopIn < loopOut
                loopOut: Easing.in(Easing.linear),
            },
          })),
        },
      ]
    }
  }

  _renderSequence = ({ item: sequence }) => (
    <Sequence
      style={styles.sequence}
      {...sequence}
    />
  )

  _keyExtractor = ({ id }) => `${id}`

  render() {
    const {
      sequences,
    } = this.state

    const d = ''

    return (
      <SafeAreaView
        style={styles.app}
      >
        <FlatList
          scrollEnabled={false}
          scrollEventThrottle={8}
          style={styles.sequences}          
          horizontal
          data={sequences}
          pagingEnabled
          keyExtractor={this._keyExtractor}
          renderItem={this._renderSequence}
        />
      </SafeAreaView>
    )
  }
}

const styles = StyleSheet.create({
  app: {
    flex: 1,
    backgroundColor: '#000',
  },
  sequences: {
    backgroundColor: '#000',
  },
})

export default App
