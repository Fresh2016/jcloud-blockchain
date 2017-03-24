/*
Copyright Jingdong 2017 All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

		 http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

package main

import (
	"bytes"
	//"fmt"
    //"os" 
	"strconv"
	"strings"
    "time"
    
	"github.com/hyperledger/fabric/core/chaincode/shim"
	pb "github.com/hyperledger/fabric/protos/peer"
)

var logger = shim.NewLogger("supplychain")

// Supply chain Chaincode implementation
type SupplyChaincode struct {
}


func main() {
	
	// For setting log level as debug
    logger.SetLevel(shim.LogDebug)
    shim.SetLoggingLevel(shim.LogDebug)
	logger.Debugf("Module supplychain logger enabled for log level: %s", shim.LogDebug)
        
	err := shim.Start(new(SupplyChaincode))
	if err != nil {
		logger.Error("Error starting Simple chaincode: %s", err)
	}
}


// Initialize chaincode, called by deploy.js
func (t *SupplyChaincode) Init(stub shim.ChaincodeStubInterface) pb.Response  {
    logger.Notice("########### supplychain_chaincode Init ###########")
	_, args := stub.GetFunctionAndParameters()

	return t.addNewTrade(stub, args)
}


// Not supported anymore
func (t *SupplyChaincode) Query(stub shim.ChaincodeStubInterface) pb.Response {
		return shim.Error("Unknown supported call")
}


// Transaction include addNewTrade, queryTrade, and (TODO) getTradeHistory
func (t *SupplyChaincode) Invoke(stub shim.ChaincodeStubInterface) pb.Response {
    
    logger.Notice("########### supplychain_chaincode Invoke ###########")
	function, args := stub.GetFunctionAndParameters()
	// TODO: should change to Debugf when loglevel bug fixed in fabric
	//logger.Debugf("Invoke is running %s with args: %s\n", function, args)
	logger.Infof("Invoke is running %s with args: %s\n", function, args)

	// Handle different functions
	if function == "addNewTrade" { // add new trade and trace info
		return t.addNewTrade(stub, args)
	} else if function == "queryTrade" { //find trade based on an ad hoc rich query
		return t.queryTrade(stub, args)
	} else if function == "getTradeHistory" { //get history of values for a trade
		return t.getTradeHistory(stub, args)
	}

	logger.Error("ERROR: Invoke did not find func: " + function) //error
	return shim.Error("Received unknown function invocation")
}


// Add new trade and trace info
func (t *SupplyChaincode) addNewTrade(stub shim.ChaincodeStubInterface, args []string) pb.Response  {
    
    logger.Info("########### supplychain_chaincode addNewTrade ###########")

	var Sku, TradeDate, TraceInfo, Counter string	// Fileds of a trade
	var SkuVal, TradeDateVal, TraceInfoVal string	// Information values of a trade 
	var CounterVal int // Used for testing TPS
	var err error

	if len(args) != 4 {
		return shim.Error("Incorrect number of arguments. Expecting 4")
	} else {
		// TODO: should change to Debugf when loglevel bug fixed in fabric
		//logger.Debugf("Received SkuVal: %s, TraceInfoVal: %s\n", args[1], args[3])
		logger.Infof("Received SkuVal: %s, TraceInfoVal: %s\n", args[1], args[3])
	}

	// Initialize the chaincode
	TradeDate = "TradeDate"
	TradeDateVal = time.Unix(time.Now().Unix(), 0).String()
	Sku = args[0]
	SkuVal = args[1]	
	TraceInfo = args[2]
	TraceInfoVal = args[3]	
	Counter = "Counter"
	CounterVal = 0
	
	// Write the state to the ledger
	err = stub.PutState(TradeDate, []byte(TradeDateVal))
	if err != nil {
		return shim.Error(err.Error())
	}

	err = stub.PutState(Sku, []byte(SkuVal))
	if err != nil {
		return shim.Error(err.Error())
	}
	
	err = stub.PutState(TraceInfo, []byte(TraceInfoVal))
	if err != nil {
		return shim.Error(err.Error())
	}
	
	CounterValbytes, err := stub.GetState(Counter)
	logger.Debugf("CounterVal was %d \n", CounterValbytes)
	if err != nil {
		return shim.Error(err.Error())
	}
	CounterVal, _ = strconv.Atoi(string(CounterValbytes))
	CounterVal = CounterVal + 1
	err = stub.PutState(Counter, []byte(strconv.Itoa(CounterVal)))
	if err != nil {
		return shim.Error(err.Error())
	}
	// TODO: should change to Debugf when loglevel bug fixed in fabric
	//logger.Debugf("CounterVal is %d \n", strconv.Itoa(CounterVal))
	logger.Infof("CounterVal is %d \n", strconv.Itoa(CounterVal))
		
    logger.Info("######### Successfully add New Trade #########")

	return shim.Success(nil)
}


// Query all fields of current state
func (t *SupplyChaincode) queryTrade(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	var Sku, TradeDate, TraceInfo, Counter string	// Fileds of a trade
	var err error
	
    logger.Info("########### supplychain_chaincode queryTrade ###########")
	printArgs(args)
	
	Sku = args[0]
	TradeDate = args[1]
	TraceInfo = args[2]
	Counter = "Counter"
	
	SkuVal, err := stub.GetState(Sku)
	if err != nil {
		return shim.Error(err.Error())
	}
	
	TradeDateVal, err := stub.GetState(TradeDate)
	if err != nil {
		return shim.Error(err.Error())
	}
	
	TraceInfoVal, err := stub.GetState(TraceInfo)
	if err != nil {
		return shim.Error(err.Error())
	}
	
	CounterValbytes, err := stub.GetState(Counter)
	// TODO: should change to Debugf when loglevel bug fixed in fabric
	//logger.Debugf("CounterVal is %d \n", CounterValbytes)
	logger.Infof("CounterVal is %d \n", CounterValbytes)
	if err != nil {
		return shim.Error(err.Error())
	}
	
	// TODO: should change to Debugf when loglevel bug fixed in fabric
	logger.Infof("1.Query results: %x\n", SkuVal)
	logger.Infof("2.Query results: %x\n", TradeDateVal)
	logger.Infof("3.Query results: %x\n", TraceInfoVal)

	QueryResults := []byte(	string(SkuVal) + "," +
							string(TradeDateVal) + "," + 
							string(TraceInfoVal) + "," + 
							string(string(CounterValbytes)))
	return shim.Success(QueryResults)
}


// Query all fields of historic state
func (t *SupplyChaincode) getTradeHistory(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	var nameOfTxId, queriedKey string	// Fileds of a trade
	var err error

    logger.Info("########### supplychain_chaincode getTradeHistory ###########")
	printArgs(args)

	if len(args) < 2 {
		return shim.Error("Incorrect number of arguments. Expecting nameOfTxId and at least 1 queriedKey")
	} else {
		nameOfTxId = args[0]
		queriedKey = args[1]
	}

	resultsIterator, err := stub.GetHistoryForKey(queriedKey)
	if err != nil {
		return shim.Error(err.Error())
	}
	defer resultsIterator.Close()

	// buffer is a JSON array containing historic values
	var buffer bytes.Buffer
	buffer = formatHistoricValue(buffer, resultsIterator, nameOfTxId, queriedKey)
	// TODO: should change to Debugf when loglevel bug fixed in fabric
	//logger.Debugf("queryTrade returning:\n%s\n", buffer.String())
	logger.Infof("queryTrade returning:\n%s\n", buffer.String())

	return shim.Success(buffer.Bytes())
}


// Generat fake TransactionId
/*
func getUUID() (string) {
	f, _ := os.OpenFile("/dev/urandom", os.O_RDONLY, 0) 
    b := make([]byte, 16) 
    f.Read(b) 
    f.Close() 
    uuid := fmt.Sprintf("%x-%x-%x-%x-%x", b[0:4], b[4:6], b[6:8], b[8:10], b[10:]) 
	return uuid
}*/



// Format historic values into string of JSON array
func formatHistoricValue(buffer bytes.Buffer, resultsIterator shim.StateQueryIteratorInterface, nameOfTxId string, queriedKey string) bytes.Buffer {
	// Start of an array
	buffer.WriteString("[")

	bArrayMemberAlreadyWritten := false
	for resultsIterator.HasNext() {
		txID, historicValue, err := resultsIterator.Next()
		if err != nil {
			logger.Error("ERROR: error in reading resultsIterator, write nothing to buffer and returning... ") //error
			return buffer
		}
		// Add a comma before array members
		// then it will be parsed in query client
		if bArrayMemberAlreadyWritten == true {
			buffer.WriteString(",")
		}
		buffer.WriteString("{\"")
		buffer.WriteString(nameOfTxId)
		buffer.WriteString("\":")
		buffer.WriteString("\"")
		buffer.WriteString(txID)
		buffer.WriteString("\"")

		buffer.WriteString(",\"")
		buffer.WriteString(queriedKey)
		buffer.WriteString("\":")
		buffer.WriteString("\"")
		buffer.WriteString(string(historicValue))
		buffer.WriteString("\"")
		buffer.WriteString("}")
		bArrayMemberAlreadyWritten = true
	}
	buffer.WriteString("]")
	
	return buffer
}


func printArgs(args []string) {
	// TODO: should change to Debugf when loglevel bug fixed in fabric
	//logger.Debugf("queryTrade received %d args: %s", len(args), strings.Join(args, ", "))
	logger.Infof("queryTrade received %d args: %s", len(args), strings.Join(args, ", "))
}