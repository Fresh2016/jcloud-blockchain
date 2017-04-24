package main

import (
	"errors"
	"github.com/hyperledger/fabric/core/chaincode/shim"
	table "github.com/hyperledger/fabric/core/chaincode/shim"
	"fmt"
	"encoding/json"
)

type SourceProductImproveChainCode struct {
}

const (
	SPLIT_DOT = "."
	USER_TABLE_NAME = "jdUser"
	USER_HASH_CODE = USER_TABLE_NAME + SPLIT_DOT + "userHashCode"
	USER_MESSAGE = USER_TABLE_NAME + SPLIT_DOT + "userMessage"

	ORG_TABLE_NAME = "jdOrg"
	ORG_HASH_CODE = ORG_TABLE_NAME + SPLIT_DOT + "orgHashCode"
	ORG_MESSAGE = ORG_HASH_CODE + SPLIT_DOT + "orgMessage"

	TRACE_RECORD_TABLE_NAME = "jdTraceRecord"
	TRACE_RECORD_SKU_TRACE_CODE = TRACE_RECORD_TABLE_NAME + SPLIT_DOT + "skuTraceCode"
	TRACE_RECORD_SKU_HASH = TRACE_RECORD_TABLE_NAME + SPLIT_DOT + "hash"
	TRACE_RECORD_SKU_TRACE_MESSAGE = TRACE_RECORD_TABLE_NAME + SPLIT_DOT + "skuTraceMessage"
	TRACE_RECORD_SKU_SIGNATURE = TRACE_RECORD_TABLE_NAME + SPLIT_DOT + "signature"
	TRACE_RECORD_SKU_OPERATOR = TRACE_RECORD_TABLE_NAME + SPLIT_DOT + "operator"

	SKU_BASE_INFO_TABLE_NAME = "jdSkuBaseInfo"
	SKU_BASE_INFO_SKU_TRACE_CODE = SKU_BASE_INFO_TABLE_NAME + SPLIT_DOT + "skuTraceCode"
	SKU_BASE_INFO_SKU_TRACE_MESSAGE = SKU_BASE_INFO_TABLE_NAME + SPLIT_DOT + "skuTraceMessage"
	SKU_BASE_INFO_SKU_SIGNATURE = SKU_BASE_INFO_TABLE_NAME + SPLIT_DOT + "signature"

	SKU_IDENTIFICATION_TABLE_NAME = "jdSkuIdentification"
	SKU_IDENTIFICATION_SKU_TRACE_CODE = SKU_IDENTIFICATION_TABLE_NAME + SPLIT_DOT + "skuTraceCode"
	SKU_IDENTIFICATION_SKU_HASH = SKU_IDENTIFICATION_TABLE_NAME + SPLIT_DOT + "hash"
	SKU_IDENTIFICATION_SKU_MESSAGE = SKU_IDENTIFICATION_SKU_TRACE_CODE + SPLIT_DOT + "skuIdentficationMessage"
	SKU_IDENTIFICATION_SKU_SIGNATURE = SKU_IDENTIFICATION_TABLE_NAME + SPLIT_DOT + "signature"
	SKU_IDENTIFICATION_SKU_OPERATOR = SKU_IDENTIFICATION_TABLE_NAME + SPLIT_DOT + "operator"

)

func (t *SourceProductImproveChainCode) Init(stub shim.ChaincodeStubInterface, function string, args []string) ([]byte, error) {
	var err error
	_, err = t.createSkuTraceRecordTable(stub, args)
	if (err != nil) {
		return nil, err
	}
	_, err = t.createSkuBaseInfoTable(stub, args)
	if (err != nil) {
		return nil, err
	}
	_, err = t.createSkuIdentificationTable(stub, args)
	if (err != nil) {
		return nil, err
	}
	_, err = t.createUserTable(stub, args)
	if (err != nil) {
		return nil, err
	}
	_, err = t.createOrgTable(stub, args)
	if (err != nil) {
		return nil, err
	}
	return nil, nil
}

func (t *SourceProductImproveChainCode) createSkuTraceRecordTable(stub shim.ChaincodeStubInterface, args []string) ([]byte, error) {
	var skuTraceRecordTable = []*table.ColumnDefinition{
		{
			Name : TRACE_RECORD_SKU_TRACE_CODE,
			Type : table.ColumnDefinition_STRING,
			Key : true,
		},
		{
			Name : TRACE_RECORD_SKU_HASH,
			Type : table.ColumnDefinition_STRING,
			Key : true,
		},
		{
			Name : TRACE_RECORD_SKU_TRACE_MESSAGE,
			Type : table.ColumnDefinition_STRING,
			Key : false,
		},
		{
			Name : TRACE_RECORD_SKU_SIGNATURE,
			Type : table.ColumnDefinition_STRING,
			Key : false,
		},
		{
			Name : TRACE_RECORD_SKU_OPERATOR,
			Type : table.ColumnDefinition_STRING,
			Key : false,
		},
	}

	_, err := stub.GetTable(TRACE_RECORD_TABLE_NAME)
	if (err != nil) {
		err := stub.CreateTable(TRACE_RECORD_TABLE_NAME, skuTraceRecordTable)
		if err != nil {
			jsonResp := "{\"Error\":\"Cannot create skuTraceRecode table\"}"
			return nil, errors.New(jsonResp)
		}
	}
	return nil, nil
}

func (t *SourceProductImproveChainCode) createSkuBaseInfoTable(stub shim.ChaincodeStubInterface, args []string) ([]byte, error) {
	var skuBaseInfoTable = []*table.ColumnDefinition{
		{
			Name : SKU_BASE_INFO_SKU_TRACE_CODE,
			Type : table.ColumnDefinition_STRING,
			Key : true,
		},
		{
			Name : SKU_BASE_INFO_SKU_TRACE_MESSAGE,
			Type : table.ColumnDefinition_STRING,
			Key : false,
		},
		{
			Name : SKU_BASE_INFO_SKU_SIGNATURE,
			Type : table.ColumnDefinition_STRING,
			Key : false,
		},
	}

	_, err := stub.GetTable(SKU_BASE_INFO_TABLE_NAME)
	if (err != nil) {
		err := stub.CreateTable(SKU_BASE_INFO_TABLE_NAME, skuBaseInfoTable)
		if err != nil {
			jsonResp := "{\"Error\":\"Cannot create skuBaseInfo table\"}"
			return nil, errors.New(jsonResp)
		}
	}
	return nil, nil
}

func (t *SourceProductImproveChainCode) createSkuIdentificationTable(stub shim.ChaincodeStubInterface, args []string) ([]byte, error) {
	var skuIdentificationTable = []*table.ColumnDefinition{
		{
			Name : SKU_IDENTIFICATION_SKU_TRACE_CODE,
			Type : table.ColumnDefinition_STRING,
			Key : true,
		},
		{
			Name : SKU_IDENTIFICATION_SKU_HASH,
			Type : table.ColumnDefinition_STRING,
			Key : true,
		},
		{
			Name : SKU_IDENTIFICATION_SKU_MESSAGE,
			Type : table.ColumnDefinition_STRING,
			Key : false,
		},
		{
			Name : SKU_IDENTIFICATION_SKU_SIGNATURE,
			Type : table.ColumnDefinition_STRING,
			Key : false,
		},
		{
			Name : SKU_IDENTIFICATION_SKU_OPERATOR,
			Type : table.ColumnDefinition_STRING,
			Key : false,
		},
	}

	_, err := stub.GetTable(SKU_IDENTIFICATION_TABLE_NAME)
	if (err != nil) {
		err := stub.CreateTable(SKU_IDENTIFICATION_TABLE_NAME, skuIdentificationTable)
		if err != nil {
			jsonResp := "{\"Error\":\"Cannot create skuIdentification table\"}"
			return nil, errors.New(jsonResp)
		}
	}
	return nil, nil
}

func (t *SourceProductImproveChainCode) createUserTable(stub shim.ChaincodeStubInterface, args []string) ([]byte, error) {
	var userTable = []*table.ColumnDefinition{
		{
			Name : USER_HASH_CODE,
			Type : table.ColumnDefinition_STRING,
			Key : true,
		},
		{
			Name : USER_MESSAGE,
			Type : table.ColumnDefinition_STRING,
			Key : false,
		},
	}

	_, err := stub.GetTable(USER_TABLE_NAME)
	if (err != nil) {
		err := stub.CreateTable(USER_TABLE_NAME, userTable)
		if err != nil {
			jsonResp := "{\"Error\":\"Cannot create user table\"}"
			return nil, errors.New(jsonResp)
		}
	}
	return nil, nil
}

func (t *SourceProductImproveChainCode) createOrgTable(stub shim.ChaincodeStubInterface, args []string) ([]byte, error) {
	var orgTable = []*table.ColumnDefinition{
		{
			Name : ORG_HASH_CODE,
			Type : table.ColumnDefinition_STRING,
			Key : true,
		},
		{
			Name : ORG_MESSAGE,
			Type : table.ColumnDefinition_STRING,
			Key : false,
		},
	}

	_, err := stub.GetTable(ORG_TABLE_NAME)
	if (err != nil) {
		err := stub.CreateTable(ORG_TABLE_NAME, orgTable)
		if err != nil {
			jsonResp := "{\"Error\":\"Cannot create user table\"}"
			return nil, errors.New(jsonResp)
		}
	}
	return nil, nil
}

func (t *SourceProductImproveChainCode) Invoke(stub shim.ChaincodeStubInterface, function string, args []string) ([]byte, error) {
	if (function == "createOrUpdateUser") {
		return t.createOrUpdateUser(stub, args)
	} else if (function == "createOrUpdateOrg") {
		return t.createOrUpdateOrg(stub, args)
	} else if (function == "addTraceRecord") {
		return t.addTraceRecord(stub, args)
	} else if (function == "addOrUpdateSkuBaseInfo") {
		return t.addOrUpdateSkuBaseInfo(stub, args)
	} else if (function == "addSkuIdentification") {
		return t.addSkuIdentification(stub, args)
	}
	jsonResp := "{\"Error\":\"no such invoke method\"}"
	return nil, errors.New(jsonResp)
}

func (t *SourceProductImproveChainCode) addOrUpdateSkuBaseInfo(stub shim.ChaincodeStubInterface, args []string) ([]byte, error) {
	if len(args) != 3 {
		return nil, errors.New("Incorrect number of arguments. Expecting 3")
	}
	var skuTraceCode, skuInfoMsg, signature string
	var err error

	skuTraceCode = args[0]
	skuInfoMsg = args[1]
	signature = args[2]
	_, err = stub.GetTable(SKU_BASE_INFO_TABLE_NAME)
	if (err != nil) {
		jsonResp := "{\"Error\":\"Cannot find skuBaseInfo table\"}"
		return nil, errors.New(jsonResp)
	}

	var row table.Row

	var columns = []*shim.Column{}
	skuTraceCodeColumn := &shim.Column{Value: &shim.Column_String_{String_: skuTraceCode}}
	skuInfoMsgColumn := &shim.Column{Value: &shim.Column_String_{String_: skuInfoMsg}}
	signatureColumn := &shim.Column{Value: &shim.Column_String_{String_: signature}}

	columns = append(columns, skuTraceCodeColumn)
	columns = append(columns, skuInfoMsgColumn)
	columns = append(columns, signatureColumn)

	row = table.Row{
		Columns : columns,
	}

	_,err = t.insertOrUpdateRow(stub, SKU_BASE_INFO_TABLE_NAME, row)
	return nil, err
}

func (t *SourceProductImproveChainCode) insertOrUpdateRow(stub shim.ChaincodeStubInterface, tableName string, row table.Row) (bool, error) {
	result, err := stub.InsertRow(tableName, row)
	if (err != nil) {
		jsonResp := "{\"Error\":\"Cannot insert or update user table\"}"
		return false, errors.New(jsonResp)
	}
	if (!result) {
		return stub.ReplaceRow(tableName, row)
	}
	return true, nil
}

func (t *SourceProductImproveChainCode) createOrUpdateUser(stub shim.ChaincodeStubInterface, args []string) ([]byte, error) {
	if len(args) != 2 {
		return nil, errors.New("Incorrect number of arguments. Expecting 2")
	}
	var userHashCode string
	var userMessage string
	var err error

	userHashCode = args[0]
	userMessage = args[1]
	_, err = stub.GetTable(USER_TABLE_NAME)
	if (err != nil) {
		jsonResp := "{\"Error\":\"Cannot find user table\"}"
		return nil, errors.New(jsonResp)
	}

	var row table.Row

	var columns = []*shim.Column{}
	userHashCodeColumn := &shim.Column{Value: &shim.Column_String_{String_: userHashCode}}
	userMessageColumn := &shim.Column{Value: &shim.Column_String_{String_: userMessage}}

	columns = append(columns, userHashCodeColumn)
	columns = append(columns, userMessageColumn)

	row = table.Row{
		Columns : columns,
	}

	_,err = t.insertOrUpdateRow(stub, USER_TABLE_NAME, row)
	return nil, err
}

func (t *SourceProductImproveChainCode) addSkuIdentification(stub shim.ChaincodeStubInterface, args []string) ([]byte, error) {
	if len(args) != 4 {
		return nil, errors.New("Incorrect number of arguments. Expecting 4")
	}
	var skuTraceCode,skuIdentificationMessage, signature string
	var err error

	skuTraceCode = args[0]
	skuIdentificationMessage = args[1]
	hash := stub.GetTxID()
	signature = args[2]
	operator := args[3]
	_, err = stub.GetTable(SKU_IDENTIFICATION_TABLE_NAME)
	if (err != nil) {
		jsonResp := "{\"Error\":\"Cannot find traceRecord table\"}"
		return nil, errors.New(jsonResp)
	}

	var row table.Row
	var columns = []*shim.Column{}
	skuTraceCodeColumn := &shim.Column{Value: &shim.Column_String_{String_: skuTraceCode}}
	hashColumn := &shim.Column{Value: &shim.Column_String_{String_: hash}}
	skuInfoMsgColumn := &shim.Column{Value: &shim.Column_String_{String_: skuIdentificationMessage}}
	signatureColumn := &shim.Column{Value: &shim.Column_String_{String_: signature}}
	operatorColumn := &shim.Column{Value: &shim.Column_String_{String_: operator}}

	columns = append(columns, skuTraceCodeColumn)
	columns = append(columns, hashColumn)
	columns = append(columns, skuInfoMsgColumn)
	columns = append(columns, signatureColumn)
	columns = append(columns, operatorColumn)

	row = table.Row{
		Columns : columns,
	}

	_,err = t.insertOrUpdateRow(stub, SKU_IDENTIFICATION_TABLE_NAME, row)
	return nil, err
}

func (t *SourceProductImproveChainCode) addTraceRecord(stub shim.ChaincodeStubInterface, args []string) ([]byte, error) {
	if len(args) != 4 {
		return nil, errors.New("Incorrect number of arguments. Expecting 4")
	}
	var skuTraceCode string
	var skuTraceMessage string
	var signature string
	var err error

	skuTraceCode = args[0]
	skuTraceMessage = args[1]
	signature = args[2]
	operator := args[3]
	hash := stub.GetTxID()
	_, err = stub.GetTable(TRACE_RECORD_TABLE_NAME)
	if (err != nil) {
		jsonResp := "{\"Error\":\"Cannot find traceRecord table\"}"
		return nil, errors.New(jsonResp)
	}

	var row table.Row
	var columns = []*shim.Column{}
	skuTraceCodeColumn := &shim.Column{Value: &shim.Column_String_{String_: skuTraceCode}}
	hashColumn := &shim.Column{Value: &shim.Column_String_{String_: hash}}
	signatureColumn := &shim.Column{Value: &shim.Column_String_{String_: signature}}
	skuTraceMessageColumn := &shim.Column{Value: &shim.Column_String_{String_: skuTraceMessage}}
	operatorColumn := &shim.Column{Value: &shim.Column_String_{String_: operator}}


	columns = append(columns, skuTraceCodeColumn)
	columns = append(columns, hashColumn)
	columns = append(columns, skuTraceMessageColumn)
	columns = append(columns, signatureColumn)
	columns = append(columns, operatorColumn)


	row = table.Row{
		Columns : columns,
	}

	_, err = t.insertOrUpdateRow(stub, TRACE_RECORD_TABLE_NAME, row)
	return nil, err
}

func (t *SourceProductImproveChainCode) createOrUpdateOrg(stub shim.ChaincodeStubInterface, args []string) ([]byte, error) {
	if len(args) != 2 {
		return nil, errors.New("Incorrect number of arguments. Expecting 2")
	}
	var orgHashCode string
	var orgMessage string
	var err error

	orgHashCode = args[0]
	orgMessage = args[1]
	_, err = stub.GetTable(ORG_TABLE_NAME)
	if (err != nil) {
		jsonResp := "{\"Error\":\"Cannot find org table\"}"
		return nil, errors.New(jsonResp)
	}

	var row table.Row

	var columns = []*shim.Column{}
	skuTraceCodeColumn := &shim.Column{Value: &shim.Column_String_{String_: orgHashCode}}
	skuInfoMsgColumn := &shim.Column{Value: &shim.Column_String_{String_: orgMessage}}

	columns = append(columns, skuTraceCodeColumn)
	columns = append(columns, skuInfoMsgColumn)

	row = table.Row{
		Columns : columns,
	}

	_, err = t.insertOrUpdateRow(stub, ORG_TABLE_NAME, row)
	return nil, err
}

func (t *SourceProductImproveChainCode) Query(stub shim.ChaincodeStubInterface, function string, args []string) ([]byte, error) {
	if (function == "findSkuInfo") {
		return t.findSkuInfo(stub, args)
	} else if (function == "findSkuTraceInfo") {
		return t.findSkuTraceInfo(stub, args)
	} else if (function == "findSkuIdentifictionInfo") {
		return t.findSkuIdentificationInfo(stub, args)
	} else if (function == "findUserInfo") {
		return t.findUserInfo(stub, args)
	} else if (function == "findOrgInfo") {
		return t.findOrgInfo(stub, args)
	}

	jsonResp := "{\"Error\":\"no such query method\"}"
	return nil, errors.New(jsonResp)
}

func (t *SourceProductImproveChainCode) findOrgInfo(stub shim.ChaincodeStubInterface, args []string) ([]byte, error) {
	if len(args) != 1 {
		return nil, errors.New("Incorrect number of arguments. Expecting 1")
	}
	var orgHashCode string

	orgHashCode = args[0]
	var err error
	var key = []shim.Column{
		{Value: &shim.Column_String_{String_: orgHashCode}},
	}
	var row table.Row
	row, err = stub.GetRow(ORG_TABLE_NAME, key)
	if (err != nil) {
		jsonResp := "{\"Error\":\"Cannot find org\"}"
		return nil, errors.New(jsonResp)
	}
	return json.Marshal(row)
}

func (t *SourceProductImproveChainCode) findUserInfo(stub shim.ChaincodeStubInterface, args []string) ([]byte, error) {
	if len(args) != 1 {
		return nil, errors.New("Incorrect number of arguments. Expecting 1")
	}
	var userHashCode string

	userHashCode = args[0]
	var err error
	var key = []shim.Column{
		{Value: &shim.Column_String_{String_: userHashCode}},
	}
	var row table.Row
	row, err = stub.GetRow(USER_TABLE_NAME, key)
	if (err != nil) {
		jsonResp := "{\"Error\":\"Cannot find user\"}"
		return nil, errors.New(jsonResp)
	}
	return json.Marshal(row)
}

func (t *SourceProductImproveChainCode) findSkuTraceInfo(stub shim.ChaincodeStubInterface, args []string) ([]byte, error) {
	if len(args) != 1 {
		return nil, errors.New("Incorrect number of arguments. Expecting 1")
	}
	var skuTraceCode string

	skuTraceCode = args[0]
	var err error
	var key = []shim.Column{
		{Value: &shim.Column_String_{String_: skuTraceCode}},
	}
	_, err = stub.GetRow(SKU_BASE_INFO_TABLE_NAME, key)
	if (err != nil) {
		jsonResp := "{\"Error\":\"Cannot find sku baseInfo\"}"
		return nil, errors.New(jsonResp)
	}

	traceRecordChannel, err := stub.GetRows(TRACE_RECORD_TABLE_NAME, key)
	var traceRecordRows []shim.Row
	if (err == nil && traceRecordChannel != nil) {
		for {
			select {
			case row, ok := <-traceRecordChannel:
				if !ok {
					traceRecordChannel = nil
				} else {
					traceRecordRows = append(traceRecordRows, row)
				}
			}
			if traceRecordChannel == nil {
				break
			}
		}

	}

	return json.Marshal(traceRecordRows)
}

func (t *SourceProductImproveChainCode) findSkuIdentificationInfo(stub shim.ChaincodeStubInterface, args []string) ([]byte, error) {
	if len(args) != 1 {
		return nil, errors.New("Incorrect number of arguments. Expecting 1")
	}
	var skuTraceCode string

	skuTraceCode = args[0]
	var err error
	var key = []shim.Column{
		{Value: &shim.Column_String_{String_: skuTraceCode}},
	}
	_, err = stub.GetRow(SKU_BASE_INFO_TABLE_NAME, key)
	if (err != nil) {
		jsonResp := "{\"Error\":\"Cannot find sku baseInfo\"}"
		return nil, errors.New(jsonResp)
	}

	skuIdentificationRowChannel, err := stub.GetRows(SKU_IDENTIFICATION_TABLE_NAME, key)
	var skuIdentificationRows []shim.Row
	if (err == nil && skuIdentificationRowChannel != nil) {
		for {
			select {
			case row, ok := <-skuIdentificationRowChannel:
				if !ok {
					skuIdentificationRowChannel = nil
				} else {
					skuIdentificationRows = append(skuIdentificationRows, row)
				}
			}
			if skuIdentificationRowChannel == nil {
				break
			}
		}
	}

	return json.Marshal(skuIdentificationRows)
}

func (t *SourceProductImproveChainCode) findSkuInfo(stub shim.ChaincodeStubInterface, args []string) ([]byte, error) {
	if len(args) != 1 {
		return nil, errors.New("Incorrect number of arguments. Expecting 1")
	}
	var skuTraceCode string

	skuTraceCode = args[0]
	var err error
	var key = []shim.Column{
		{Value: &shim.Column_String_{String_: skuTraceCode}},
	}
	var row table.Row
	row, err = stub.GetRow(SKU_BASE_INFO_TABLE_NAME, key)
	if (err != nil) {
		jsonResp := "{\"Error\":\"Cannot find sku baseInfo\"}"
		return nil, errors.New(jsonResp)
	}

	return json.Marshal(row)
}

func main() {
	err := shim.Start(new(SourceProductImproveChainCode))
	if err != nil {
		fmt.Printf("Error starting chaincode: %s", err)
	}
}
