// From fabric/bddtests/peer/transaction_pb2.py

_TXVALIDATIONCODE = _descriptor.EnumDescriptor(
  name='TxValidationCode',
  full_name='protos.TxValidationCode',
  filename=None,
  file=DESCRIPTOR,
  values=[
    _descriptor.EnumValueDescriptor(
      name='VALID', index=0, number=0,
      options=None,
      type=None),
    _descriptor.EnumValueDescriptor(
      name='NIL_ENVELOPE', index=1, number=1,
      options=None,
      type=None),
    _descriptor.EnumValueDescriptor(
      name='BAD_PAYLOAD', index=2, number=2,
      options=None,
      type=None),
    _descriptor.EnumValueDescriptor(
      name='BAD_COMMON_HEADER', index=3, number=3,
      options=None,
      type=None),
    _descriptor.EnumValueDescriptor(
      name='BAD_CREATOR_SIGNATURE', index=4, number=4,
      options=None,
      type=None),
    _descriptor.EnumValueDescriptor(
      name='INVALID_ENDORSER_TRANSACTION', index=5, number=5,
      options=None,
      type=None),
    _descriptor.EnumValueDescriptor(
      name='INVALID_CONFIG_TRANSACTION', index=6, number=6,
      options=None,
      type=None),
    _descriptor.EnumValueDescriptor(
      name='UNSUPPORTED_TX_PAYLOAD', index=7, number=7,
      options=None,
      type=None),
    _descriptor.EnumValueDescriptor(
      name='BAD_PROPOSAL_TXID', index=8, number=8,
      options=None,
      type=None),
    _descriptor.EnumValueDescriptor(
      name='DUPLICATE_TXID', index=9, number=9,
      options=None,
      type=None),
    _descriptor.EnumValueDescriptor(
      name='ENDORSEMENT_POLICY_FAILURE', index=10, number=10,
      options=None,
      type=None),
    _descriptor.EnumValueDescriptor(
      name='MVCC_READ_CONFLICT', index=11, number=11,
      options=None,
      type=None),
    _descriptor.EnumValueDescriptor(
      name='PHANTOM_READ_CONFLICT', index=12, number=12,
      options=None,
      type=None),
    _descriptor.EnumValueDescriptor(
      name='UNKNOWN_TX_TYPE', index=13, number=13,
      options=None,
      type=None),
    _descriptor.EnumValueDescriptor(
      name='TARGET_CHAIN_NOT_FOUND', index=14, number=14,
      options=None,
      type=None),
    _descriptor.EnumValueDescriptor(
      name='MARSHAL_TX_ERROR', index=15, number=15,
      options=None,
      type=None),
    _descriptor.EnumValueDescriptor(
      name='NIL_TXACTION', index=16, number=16,
      options=None,
      type=None),
    _descriptor.EnumValueDescriptor(
      name='INVALID_OTHER_REASON', index=17, number=255,
      options=None,
      type=None),
  ],
  containing_type=None,
  options=None,
  serialized_start=610,
  serialized_end=1060,
)